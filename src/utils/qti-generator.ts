import * as XLSX from 'xlsx';

export interface Question {
  id: string;
  type: 'MC' | 'TF' | 'MR';
  qtiType?: string; // multiple_choice_question, true_false_question, multiple_answers_question
  text: string;
  points: number;
  choices: {
    id: string;
    text: string;
    isCorrect: boolean;
  }[];
}

interface RawRow {
  'Question Text': string;
  'Type': string;
  'Points': string | number;
  'Choice A': string;
  'Choice B': string;
  'Choice C': string;
  'Choice D': string;
  'Correct Answer': string;
}

/**
 * Parses an Excel or CSV file into a list of Question objects.
 * Supports standard headers AND the custom headerless format found in user samples.
 */
export async function parseQuestionsFromFile(file: File): Promise<Question[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        // SAFE UTF-8 READING: Use array buffer
        // raw: true prevents auto-parsing "1,2,4" as a date (Jan 2, 2004)
        const workbook = XLSX.read(data, { type: 'array', raw: true });
        const firstSheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[firstSheetName];

        let questions: Question[] = [];

        // Re-read with raw: true to avoid date parsing of "1,2,4"
        const rawJsonSheet = XLSX.utils.sheet_to_json<any>(sheet, { raw: true });

        // Check for headers
        if (rawJsonSheet.length > 0 && rawJsonSheet[0]['Question Text']) {
          // Standard Format with Headers
          questions = rawJsonSheet.map((row) => {
            const type = (row['Type'] || 'MC').toUpperCase().trim();
            const qId = `question_${crypto.randomUUID()}`;
            const correctVal = (row['Correct Answer'] || '').toString().trim().toUpperCase();
            const choices: { id: string; text: string; isCorrect: boolean }[] = [];

            if (type === 'MC' || type === 'MR') {
              ['A', 'B', 'C', 'D'].forEach(opt => {
                const choiceId = `${qId}_choice_${opt}`;
                if (row[`Choice ${opt}`]) {
                  const isCorrect = correctVal.includes(opt);
                  choices.push({
                    id: choiceId,
                    text: (row[`Choice ${opt}`] || '').toString(),
                    isCorrect
                  });
                }
              });
            } else if (type === 'TF') {
              choices.push({ id: `${qId}_true`, text: 'True', isCorrect: correctVal === 'TRUE' || correctVal === 'T' });
              choices.push({ id: `${qId}_false`, text: 'False', isCorrect: correctVal === 'FALSE' || correctVal === 'F' });
            }

            return {
              id: qId,
              type: (type === 'TF') ? 'TF' : (type === 'MR' ? 'MR' : 'MC'),
              qtiType: type === 'MR' ? 'multiple_answers_question' : (type === 'TF' ? 'true_false_question' : 'multiple_choice_question'),
              text: (row['Question Text'] || '').toString(),
              points: Number(row['Points']) || 1,
              choices
            };
          });
        } else {
          // Headerless / Custom Format (User's Sample)
          console.log("Detected headerless/custom format");
          // Use raw: true to prevent "1,2,4" -> 37988.xxxx
          const rows = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1, raw: true });

          questions = rows.filter(r => r.length > 0).map((row, idx) => {
            // Auto-Detect Structure:
            // Case 1 (User's latest screenshot): [Type, Points, Question, Correct, Choices...]
            // Case 2 (Previous file): [Type, Empty, Points, Question, Correct, Choices...]

            // Heuristic: Check column 1 (Index 1)
            // We need to distinguish between:
            // Compact: [Type, Points, Question, Correct, Choices...]
            // Spaced:  [Type, Empty, Points, Question, Correct, Choices...]

            const col1 = row[1];

            // Strict check: Is it a NUMBER? 
            // strings like " " or "" convert to 0, so we must check typeof or content length
            const isCol1ReallyNumber = (typeof col1 === 'number') ||
              (typeof col1 === 'string' && col1.trim().length > 0 && !isNaN(Number(col1)));

            let pointsIndex = 1;
            let questionIndex = 2;
            let correctIndex = 3;
            let choiceStartIndex = 4;

            if (!isCol1ReallyNumber) {
              // Assume "Spaced" format
              pointsIndex = 2;
              questionIndex = 3;
              correctIndex = 4;
              choiceStartIndex = 5;
            }

            const type = (row[0] || 'MC').toString().toUpperCase().trim();
            const points = Number(row[pointsIndex]) || 1;
            const text = (row[questionIndex] || '').toString();
            const rawCorrect = (row[correctIndex] || '').toString();

            const qId = `question_${crypto.randomUUID()}`;
            const choices: { id: string; text: string; isCorrect: boolean }[] = [];

            const choiceRawValues = row.slice(choiceStartIndex);

            choiceRawValues.forEach((choiceText, index) => {
              if (choiceText === undefined || choiceText === null || choiceText === '') return;
              const choiceId = `${qId}_choice_${index + 1}`;

              // Correct logic: "2" means 2nd choice (1-based index)
              // "1,2,4" means 1st, 2nd, 4th choices
              const correctIndices = rawCorrect.split(/[,;]/).map(s => s.trim());
              let isCorrect = correctIndices.includes((index + 1).toString());

              // Fallback: If no index match, check text match (e.g. "TRUE")
              if (!isCorrect && rawCorrect.toUpperCase() === choiceText.toString().toUpperCase()) {
                isCorrect = true;
              }

              choices.push({
                id: choiceId,
                text: choiceText.toString(),
                isCorrect
              });
            });

            return {
              id: qId,
              type: (type === 'TF') ? 'TF' : (type === 'MR' ? 'MR' : 'MC'),
              qtiType: type === 'MR' ? 'multiple_answers_question' : (type === 'TF' ? 'true_false_question' : 'multiple_choice_question'),
              text,
              points: points,
              choices
            };
          });
        }

        resolve(questions);
      } catch (err) {
        console.error("Parse Error:", err);
        reject(err);
      }
    };

    reader.onerror = () => reject(new Error('Failed to read file for parsing'));
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Generates the QTI 1.2 XML string from a list of questions.
 * This format is compatible with Canvas LMS.
 */
export function generateQTIXML(questions: Question[]): string {
  const assessmentId = `assessment_${crypto.randomUUID()}`;

  // Header matching user sample (Canvas export style)
  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<questestinterop xmlns="http://www.imsglobal.org/xsd/ims_qtiasiv1p2" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.imsglobal.org/xsd/ims_qtiasiv1p2 http://www.imsglobal.org/xsd/ims_qtiasiv1p2p1.xsd">
  <assessment ident="${assessmentId}" title="Imported Quiz (${new Date().toLocaleDateString()})">
    <qtimetadata>
      <qtimetadatafield>
        <fieldlabel>cc_maxattempts</fieldlabel>
        <fieldentry>1</fieldentry>
      </qtimetadatafield>
    </qtimetadata>
    <section ident="root_section">`;

  questions.forEach(q => {
    const escapedText = escapeXml(q.text);
    const escapedTitle = escapedText.substring(0, 20).replace(/\s/g, '_') + '...';

    // Canvas Types: multiple_choice_question, true_false_question, multiple_answers_question
    const qtiType = q.qtiType || 'multiple_choice_question';
    const isMultipleResponse = qtiType === 'multiple_answers_question';
    const cardinality = isMultipleResponse ? 'Multiple' : 'Single';

    // Condition Variable Generation
    let conditionsXml = '';

    if (isMultipleResponse) {
      // MR: Partial Credit with Custom Rounding Logic
      // We generate a specific rule for EVERY combination of correct answers.
      // Any selection including an Incorrect answer -> 0 points (Strict).

      const correctOptions = q.choices.filter(c => c.isCorrect);
      const incorrectOptions = q.choices.filter(c => !c.isCorrect);

      // Helper to get score based on round half up logic
      const getScore = (k: number, n: number, points: number) => {
        const raw = (k / n) * points;
        const decimal = raw % 1;
        // If exactly 0.5, keep it. Else round to nearest int.
        if (Math.abs(decimal - 0.5) < 0.001) return Math.floor(raw) + 0.5;
        return Math.round(raw);
      };

      // Generate rules for subsets of correct answers of size k=1 to N
      // We iterate k from N down to 1 (Most points to least)
      const totalCorrect = correctOptions.length;

      // Generate all combinations (Power Set of correct options)
      // This ensures we match specific selected subsets
      const allCombinations: typeof correctOptions[] = [];
      const combine = (start: number, current: typeof correctOptions) => {
        if (current.length > 0) allCombinations.push([...current]);
        for (let i = start; i < correctOptions.length; i++) {
          combine(i + 1, [...current, correctOptions[i]]);
        }
      };
      combine(0, []);

      // Sort by size descending (match largest first) so 100% match is first
      allCombinations.sort((a, b) => b.length - a.length);

      conditionsXml = allCombinations.map(subset => {
        const score = getScore(subset.length, totalCorrect, q.points);
        if (score <= 0) return ''; // Skip 0 point rules (default is 0)

        // Correct IDs in this subset
        const matchIds = subset.map(c => `<varequal respident="response1">${c.id}</varequal>`).join('');

        // Correct IDs NOT in this subset (Must NOT be selected for this specific partial score rule)
        const missingCorrect = correctOptions
          .filter(c => !subset.find(x => x.id === c.id))
          .map(c => `<not><varequal respident="response1">${c.id}</varequal></not>`)
          .join('');

        // Incorrect IDs (Must NOT be selected)
        const noIncorrect = incorrectOptions
          .map(c => `<not><varequal respident="response1">${c.id}</varequal></not>`)
          .join('');

        return `
          <respcondition continue="No">
            <conditionvar>
              <and>
                ${matchIds}
                ${missingCorrect}
                ${noIncorrect}
              </and>
            </conditionvar>
            <setvar action="Set" varname="SCORE">${score}</setvar>
          </respcondition>`;
      }).join('');

    } else {
      // Single Choice / TF
      const match = q.choices.filter(c => c.isCorrect).map(c => `<varequal respident="response1">${c.id}</varequal>`).join('');
      conditionsXml = `
          <respcondition continue="No">
            <conditionvar>
              ${match}
            </conditionvar>
            <setvar action="Set" varname="SCORE">100</setvar>
          </respcondition>`;
    }

    xml += `
      <item ident="${q.id}" title="${escapedTitle}">
        <itemmetadata>
          <qtimetadata>
            <qtimetadatafield>
              <fieldlabel>question_type</fieldlabel>
              <fieldentry>${qtiType}</fieldentry>
            </qtimetadatafield>
            <qtimetadatafield>
              <fieldlabel>points_possible</fieldlabel>
              <fieldentry>${q.points}</fieldentry>
            </qtimetadatafield>
            <qtimetadatafield>
              <fieldlabel>original_answer_ids</fieldlabel>
              <fieldentry>${q.choices.filter(c => c.isCorrect).map(c => c.id).join(',')}</fieldentry>
            </qtimetadatafield>
            <qtimetadatafield>
              <fieldlabel>assessment_question_identifierref</fieldlabel>
              <fieldentry>idRef_${q.id}</fieldentry>
            </qtimetadatafield>
          </qtimetadata>
        </itemmetadata>
        <presentation>
          <material>
            <mattext texttype="text/html">${escapedText}</mattext>
          </material>
          <response_lid ident="response1" rcardinality="${cardinality}">
            <render_choice>
              ${q.choices.map(c => `
                <response_label ident="${c.id}">
                  <material>
                    <mattext texttype="text/plain">${escapeXml(c.text)}</mattext>
                  </material>
                </response_label>
              `).join('')}
            </render_choice>
          </response_lid>
        </presentation>
        <resprocessing>
          <outcomes>
            <decvar maxvalue="100" minvalue="0" varname="SCORE" vartype="Decimal"/>
          </outcomes>
          ${conditionsXml}
        </resprocessing>
      </item>`;
  });

  xml += `
    </section>
  </assessment>
</questestinterop>`;

  return xml;
}

function escapeXml(unsafe: string): string {
  if (!unsafe) return '';
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case "'": return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}
