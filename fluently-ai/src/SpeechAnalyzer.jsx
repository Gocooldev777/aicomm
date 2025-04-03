export const analyzeFluency = (transcript, wordsPerMinute, pauseCount) => {
    // Calculate hesitations (um, uh, er, etc.)
    const hesitationWords = ['um', 'uh', 'er', 'ah', 'like'];
    const words = transcript.toLowerCase().split(' ');
    const hesitations = words.filter(word => hesitationWords.includes(word)).length;

    // Calculate fluency score
    let score = 100;
    
    // Deduct for slow speech (ideal is 120-150 wpm)
    if (wordsPerMinute < 120) {
        score -= (120 - wordsPerMinute) * 0.5;
    }
    
    // Deduct for excessive pauses
    score -= pauseCount * 5;
    
    // Deduct for hesitations
    score -= hesitations * 3;

    // Ensure score stays between 0 and 100
    score = Math.max(0, Math.min(100, score));

    return {
        score: Math.round(score),
        wordsPerMinute: Math.round(wordsPerMinute),
        pauseCount,
        hesitations
    };
};

export const analyzeVocabulary = (transcript) => {
    const words = transcript.toLowerCase().split(' ');
    const uniqueWords = new Set(words);
    
    // Consider words longer than 6 characters as "complex"
    const complexWords = words.filter(word => word.length > 6);
    
    // Calculate vocabulary variety index
    const varietyIndex = (uniqueWords.size / words.length) * 100;
    
    let score = Math.min(100, 
        (uniqueWords.size * 10) + 
        (complexWords.length * 5)
    );

    return {
        score: Math.round(score),
        uniqueWords: uniqueWords.size,
        complexWords: complexWords.length,
        varietyIndex: Math.round(varietyIndex)
    };
};

export const analyzeGrammar = (transcript) => {
    // This is a simplified grammar check
    // In a real application, you'd want to use a proper NLP library
    const commonErrors = [
        {pattern: /\bi am\b/gi, suggestion: "I am"},
        {pattern: /\bi dont\b/gi, suggestion: "I don't"},
        {pattern: /\bthey was\b/gi, suggestion: "they were"},
    ];

    let errors = [];
    commonErrors.forEach(({pattern, suggestion}) => {
        if (pattern.test(transcript)) {
            errors.push(`Consider using "${suggestion}"`);
        }
    });

    const score = Math.max(0, 100 - (errors.length * 20));

    return {
        score,
        errors
    };
};
