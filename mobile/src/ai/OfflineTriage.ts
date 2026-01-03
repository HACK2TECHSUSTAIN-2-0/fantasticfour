export interface TriageResult {
    user_message: string;
    category: string;
    severity: "LOW" | "MEDIUM" | "HIGH" | "NONE";
    confidence: number;
    classification_source: string;
}

// ----------------------------------------------------
// 1. CONSTANTS & DICTIONARIES
// ----------------------------------------------------

const INCIDENT_KEYWORDS: Record<string, string[]> = {
    medical: [
        "bleeding", "fainted", "unconscious", "injured",
        "accident", "hurt", "pain", "ambulance", "doctor", "hospital",
        "stroke", "seizure", "asthma", "breathing", "not breathing",
        "chest pain", "cardiac", "heart", "allergic", "allergy", "fever", "sick"
    ],
    harassment: [
        "following", "stalking", "harassing",
        "unsafe", "threat", "scared"
    ],
    security: [
        "fight", "weapon", "attack", "threat",
        "suspicious", "intruder"
    ]
};

const PANIC_WORDS = [
    "help", "urgent", "now", "emergency",
    "please", "asap"
];

const CRITICAL_MEDICAL_TERMS = [
    "heart attack",
    "cardiac arrest",
    "not breathing",
    "cant breathe",
    "can't breathe",
    "difficulty breathing",
    "unconscious",
    "seizure",
    "stroke",
    "bleeding heavily",
    "blood everywhere",
    "breathing stopped"
];

const NEGATION_PHRASES = [
    "i dont need help",
    "i do not need help",
    "no help needed",
    "everything is fine",
    "false alarm",
    "nothing is wrong",
    "ignore this",
    "dont worry im fine",
    "don't worry im fine",
    "cancel",
    "cancel emergency",
    "just testing",
    "test only"
];

const NO_RISK_TEXTS = new Set([
    "ok", "okay", "okey", "k", "kk",
    "yes", "yeah", "yep",
    "no", "nah",
    "fine", "cool", "fun", "nice", "great", "good", "done",
    "alright", "all right", "all good",
    "sounds good", "perfect", "awesome", "amazing",
    "sure", "sure thing",
    "got it", "noted", "understood",
    "thanks", "thank you", "thank u", "thx", "ty",
    "much appreciated", "cool thanks", "ok thanks", "thanks ok", "thanks 👍",
    "welcome",
    "hmm", "hmmm", "hm", "uh", "uhh", "uh huh",
    "lol", "lmao", "haha", "hehe", "rofl",
    "yo", "sup", "hey", "hi", "hello", "hola",
    "bye", "bye bye", "goodbye", "see you", "see ya", "later",
    "brb", "afk",
    "idk", "dont know", "don't know",
    "whatever", "nothing",
    "nvm", "never mind",
    "ignore", "cancel", "stop",
    "test", "testing", "just testing", "ping", "pong", "check", "checking",
    "👍", "👌", "✅", "🙂", "😊", "😄", "😂", "😅", "😆", "😉", "😎", "🤝", "🙏"
]);

// ----------------------------------------------------
// 2. HELPER FUNCTIONS
// ----------------------------------------------------

function normalizeText(text: string): string {
    let t = text.toLowerCase().trim();
    t = t.replace(/[^\w\s]/g, ""); // remove emojis & symbols
    t = t.replace(/\s+/g, " ");
    return t;
}

function isNoRisk(text: string): boolean {
    const t = normalizeText(text);

    if (t === "") {
        return true; // ".", "...", emojis only
    }

    if (t.split(" ").length <= 3) {
        if (NO_RISK_TEXTS.has(t)) return true;
        for (const noRisk of NO_RISK_TEXTS) {
            if (t.startsWith(noRisk)) return true;
        }
    }
    return false;
}

function isExplicitNegation(text: string): boolean {
    const t = text.toLowerCase();
    return NEGATION_PHRASES.some(phrase => t.includes(phrase));
}

function criticalOverride(text: string) {
    const t = text.toLowerCase();
    const medicalTriggers = [
        "heart attack",
        "cardiac arrest",
        "not breathing",
        "stopped breathing",
        "unconscious",
        "passed out",
        "collapsed",
        "fell down",
        "not responding",
        "unresponsive",
        "seizure",
        "stroke",
        "bleeding heavily"
    ];

    // Strong medical override
    if (medicalTriggers.some(k => t.includes(k))) {
        return {
            category: "medical",
            force_severity: "HIGH" as const,
            force_confidence: 0.9,
            source: "critical_override"
        };
    }

    // 🚨 SECURITY OVERRIDE (WEAPON / VIOLENCE)
    const securityTriggers = [
        "weapon", "knife", "gun", "firearm",
        "blade", "machete", "pistol", "rifle",
        "attack", "attacking", "threatening", "fire"
    ];

    if (securityTriggers.some(k => t.includes(k))) {
        return {
            category: "security",
            force_severity: "HIGH" as const,
            force_confidence: 0.9,
            source: "critical_override_security"
        };
    }

    if (CRITICAL_MEDICAL_TERMS.some(term => t.includes(term))) {
        return {
            category: "medical",
            force_severity: "HIGH" as const,
            force_confidence: 0.9,
            source: "critical_override"
        };
    }

    return null;
}

function computeSeverityAndConfidence(text: string, silent: boolean) {
    const t = text.toLowerCase();
    const panicScore = PANIC_WORDS.filter(w => t.includes(w)).length;

    let confidence = 0.3; // base confidence

    // Panic words only matter for meaningful text
    if (panicScore > 0 && t.split(" ").length >= 3) {
        confidence += 0.3;
    }

    if (silent) {
        confidence += 0.2;
    }

    confidence = Math.min(confidence, 1.0);

    let severity: "LOW" | "MEDIUM" | "HIGH";
    if (confidence >= 0.75) {
        severity = "HIGH";
    } else if (confidence >= 0.5) {
        severity = "MEDIUM";
    } else {
        severity = "LOW";
    }

    return { severity, confidence: Number(confidence.toFixed(2)) };
}

function classifyIncident(text: string): { category: string; source: string } {
    const textL = text.toLowerCase();

    // Keyword classification
    const scores: Record<string, number> = {};
    for (const [cat, words] of Object.entries(INCIDENT_KEYWORDS)) {
        scores[cat] = words.filter(w => textL.includes(w)).length;
    }

    // Find max score
    let maxScore = 0;
    let keywordCategory = "general";

    for (const [cat, score] of Object.entries(scores)) {
        if (score > maxScore) {
            maxScore = score;
            keywordCategory = cat;
        }
    }

    if (maxScore > 0) {
        return { category: keywordCategory, source: "keyword" };
    }

    // Fallback checks
    if ((scores["medical"] || 0) > 0) {
        return { category: "medical", source: "keyword_priority" };
    }

    return { category: "general", source: "fallback" };
}

// ----------------------------------------------------
// 3. MAIN EXPORTED FUNCTION
// ----------------------------------------------------

/**
 * Runs the offline 3-layer AI triage on the edge device.
 * Returns a TriageResult object compatible with the backend.
 */
export function runOfflineEdgeTriage(text: string, silent: boolean = false): TriageResult {
    const raw = text.trim();

    // 0. NO_RISK must be first
    if (isNoRisk(text)) {
        return {
            user_message: raw,
            category: "no_risk",
            severity: "NONE",
            confidence: 0.05,
            classification_source: "no_risk"
        };
    }

    // 1. Explicit negation
    if (isExplicitNegation(text)) {
        return {
            user_message: raw,
            category: "general",
            severity: "LOW",
            confidence: 0.2,
            classification_source: "explicit_negation"
        };
    }

    // 2. Critical override
    const override = criticalOverride(text);
    if (override) {
        return {
            user_message: raw,
            category: override.category,
            severity: override.force_severity,
            confidence: override.force_confidence,
            classification_source: override.source
        };
    }

    // 'No Signal' check (single word alphanum)
    if (raw.replace(/\s/g, '').length > 0 && raw.split(/\s+/).length === 1 && /^[a-z0-9]+$/i.test(raw)) {
        return {
            user_message: raw,
            category: "no_signal",
            severity: "LOW",
            confidence: 0.1,
            classification_source: "no_signal"
        };
    }


    // 3. Normal pipeline
    const { category, source } = classifyIncident(raw);
    let { severity, confidence } = computeSeverityAndConfidence(raw, silent);

    // Cap GENERAL category escalation
    if (category === "general") {
        confidence = Math.min(confidence, 0.6);
        if (confidence < 0.5) {
            severity = "LOW";
        } else {
            severity = "MEDIUM";
        }
    }

    return {
        user_message: raw,
        category,
        severity,
        confidence,
        classification_source: source
    };
}
