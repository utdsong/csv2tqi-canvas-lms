const XLSX = require('xlsx');
const fs = require('fs');

const filePath = './Sample Question Bank for Import - Sample Question Bank for Import (3).csv';
const fileBuffer = fs.readFileSync(filePath);

const workbook = XLSX.read(fileBuffer, { type: 'buffer', raw: true });
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];

// 1. Raw rows (raw: true)
const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: true });
console.log('--- RAW: TRUE ---');
console.log(JSON.stringify(rows[3], null, 2));

// 1b. Raw rows (raw: false)
const rowsText = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false });
console.log('--- RAW: FALSE ---');
console.log(JSON.stringify(rowsText[3], null, 2));

// 2. Logic Check
const row = rows[3];
const col1 = row[1];
const isCol1ReallyNumber = (typeof col1 === 'number') ||
    (typeof col1 === 'string' && col1.trim().length > 0 && !isNaN(Number(col1)));

console.log('isCol1ReallyNumber:', isCol1ReallyNumber);
console.log('col1 type:', typeof col1);
console.log('col1 value:', col1);

let pointsIndex = 1;
let questionIndex = 2;
let correctIndex = 3;
let choiceStartIndex = 4;

if (!isCol1ReallyNumber) {
    pointsIndex = 2;
    questionIndex = 3;
    correctIndex = 4;
    choiceStartIndex = 5;
}

const rawCorrect = (row[correctIndex] || '').toString();
console.log('Raw Correct:', rawCorrect);

const correctIndices = rawCorrect.split(/[,;]/).map(s => s.trim());
console.log('Parsed Indices:', correctIndices);

// Check matches
const choiceRawValues = row.slice(choiceStartIndex);
choiceRawValues.forEach((choiceText, index) => {
    const isCorrect = correctIndices.includes((index + 1).toString());
    console.log(`Choice ${index + 1} ("${choiceText}"): Correct? ${isCorrect}`);
});
