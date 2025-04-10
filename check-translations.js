const fs = require('fs');
const path = require('path');

// Function to normalize a string for comparison
function normalizeString(str) {
    return str ? str.trim().toLowerCase() : '';
}

// Function to read and parse JSON file
function readJsonFile(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(content);
    } catch (error) {
        console.error(`Error reading file ${filePath}:`, error);
        return null;
    }
}

// Function to compare translations
function compareTranslations(reference, target) {
    const missing = {};
    
    for (const key in reference) {
        if (!target[key]) {
            missing[key] = reference[key];
        } else {
            // Check if the message exists but might be different in case/whitespace
            const refMessage = normalizeString(reference[key].message);
            const targetMessage = normalizeString(target[key].message);
            
            if (refMessage && !targetMessage) {
                missing[key] = reference[key];
            }
        }
    }
    
    return missing;
}

// Function to get all language folders
function getLanguageFolders() {
    const localesDir = path.join(__dirname, '_locales');
    return fs.readdirSync(localesDir)
        .filter(item => {
            const itemPath = path.join(localesDir, item);
            return fs.statSync(itemPath).isDirectory() && 
                   fs.existsSync(path.join(itemPath, 'messages.json'));
        });
}

// Main function
function checkTranslations() {
    const localesDir = path.join(__dirname, '_locales');
    const languages = getLanguageFolders();
    const enMessages = JSON.parse(fs.readFileSync(path.join(localesDir, 'en', 'messages.json'), 'utf8'));
    const totalStrings = Object.keys(enMessages).length;
    
    console.log('\nTranslation Status Summary:');
    console.log('==========================');
    
    for (const lang of languages) {
        if (lang === 'en') continue;
        
        const langMessages = JSON.parse(fs.readFileSync(path.join(localesDir, lang, 'messages.json'), 'utf8'));
        const missingKeys = Object.keys(enMessages).filter(key => !langMessages[key]);
        const missingCount = missingKeys.length;
        const percentage = ((missingCount / totalStrings) * 100).toFixed(2);
        
        console.log(`\n${lang.toUpperCase()}: ${missingCount} missing (${percentage}%) out of ${totalStrings} total strings`);
        
        if (missingCount > 0) {
            console.log('\nMissing strings:');
            console.log('---------------');
            const missingTranslations = {};
            for (const key of missingKeys) {
                missingTranslations[key] = enMessages[key];
            }
            console.log(JSON.stringify(missingTranslations, null, 2));
        }
    }
}

checkTranslations(); 