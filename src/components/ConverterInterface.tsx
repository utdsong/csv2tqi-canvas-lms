'use client';

import { useState } from 'react';
import { FileUp, PackageCheck, AlertCircle, Loader2, Download, FileSpreadsheet, FileCode } from 'lucide-react';
import { parseQuestionsFromFile, generateQTIXML, Question } from '@/utils/qti-generator';
import { createCanvasPackage } from '@/utils/packaging';

export default function ConverterInterface() {
    const [file, setFile] = useState<File | null>(null);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string>('');
    const [generating, setGenerating] = useState(false);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (!selectedFile) return;

        setLoading(true);
        setError('');
        setFile(selectedFile);
        setQuestions([]);

        try {
            // 1. Parse Questions
            const parsedQuestions = await parseQuestionsFromFile(selectedFile);
            if (parsedQuestions.length === 0) {
                setError('No questions found. Please check your file headers.');
            } else {
                setQuestions(parsedQuestions);
            }
        } catch (err) {
            console.error(err);
            setError('Failed to parse file. Ensure it is a valid Excel or CSV file with the correct headers.');
        } finally {
            setLoading(false);
        }
    };

    const handleGenerate = async () => {
        if (questions.length === 0) return;
        setGenerating(true);
        try {
            // 2. Generate XML
            const xml = generateQTIXML(questions);

            // 3. Package ZIP (Single XML)
            const cleanName = file?.name.replace(/\.[^/.]+$/, "") || 'quiz';
            const zipBlob = await createCanvasPackage(xml, `${cleanName}.xml`);

            // 4. Download
            const url = URL.createObjectURL(zipBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${cleanName}_qti.zip`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error(err);
            setError('Failed to generate ZIP package.');
        } finally {
            setGenerating(false);
        }
    };

    const mcCount = questions.filter(q => q.type === 'MC').length;
    const tfCount = questions.filter(q => q.type === 'TF').length;

    return (
        <div className="w-full max-w-4xl mx-auto p-6 bg-white rounded-2xl shadow-sm border border-slate-100">
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                    <PackageCheck className="w-6 h-6 text-primary" />
                    QTI 1.2 Converter
                </h2>
                <p className="text-slate-500 mt-2">
                    ខបករណ៏សម្រាប់បំប្លែងហ្វាល់សំណួរនៅ Excel/CSV ទៅជាហ្វាល់ QTI ZIP សម្រាប់ផ្ទេរសំណួរទៅប្រព័ន្ធសិក្សា Canvas
                </p>
            </div>

            {!file && (
                <div className="border-2 border-dashed border-slate-300 rounded-xl p-12 text-center hover:border-primary transition-colors bg-slate-50">
                    <input
                        type="file"
                        accept=".xlsx, .xls, .csv"
                        onChange={handleFileUpload}
                        className="hidden"
                        id="qti-upload"
                    />
                    <label
                        htmlFor="qti-upload"
                        className="cursor-pointer flex flex-col items-center justify-center gap-4"
                    >
                        <div className="p-4 bg-white rounded-full shadow-sm">
                            <FileSpreadsheet className="w-8 h-8 text-primary" />
                        </div>
                        <div className="text-slate-600 font-medium">
                            ចុចដើម្បីធ្វើការបង្ហោះ ហ្វាល់ Excel ឬ​ CSV
                        </div>
                        <div className="text-sm text-slate-400">
                            ត្រូវប្រាកដថាហ្វាល់ CSV របស់អ្នកមើលឃើញជាភាសាខ្មែរ មិនមែនភាសា Binary
                        </div>
                    </label>
                </div>
            )}

            {loading && (
                <div className="flex items-center justify-center p-12">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            )}

            {error && (
                <div className="p-4 bg-red-50 text-red-600 rounded-lg flex items-center gap-2 mb-4">
                    <AlertCircle className="w-5 h-5" />
                    {error}
                </div>
            )}

            {file && !loading && !error && (
                <div className="space-y-6">
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
                        <div className="flex gap-4 items-center">
                            <div className="bg-white p-2 rounded shadow-sm">
                                <FileSpreadsheet className="w-6 h-6 text-green-600" />
                            </div>
                            <div>
                                <p className="text-slate-800 font-semibold">{file.name}</p>
                                <p className="text-xs text-slate-500">
                                    {questions.length} Questions Found ({mcCount} MC, {tfCount} TF)
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => {
                                setFile(null);
                                setQuestions([]);
                            }}
                            className="text-sm text-red-500 hover:text-red-600 underline"
                        >
                            Change File
                        </button>
                    </div>

                    {/* Questions Preview List (collapsible or scrollable) */}
                    <div className="max-h-64 overflow-y-auto border border-slate-200 rounded-lg p-2 bg-slate-50 space-y-2">
                        {questions.map((q, idx) => (
                            <div key={q.id} className="p-3 bg-white rounded border border-slate-100 flex justify-between items-center text-sm">
                                <div className="flex-1 truncate pr-4">
                                    <span className="font-bold text-slate-400 mr-2">#{idx + 1}</span>
                                    <span className="font-medium text-slate-700">{q.text}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${q.type === 'TF' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                                        {q.type}
                                    </span>
                                    <span className="text-slate-400 text-xs">{q.points} pt</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="flex justify-end gap-3">
                        <div className="flex gap-4 w-full">
                            <button
                                onClick={handleGenerate}
                                disabled={generating}
                                className="flex-1 bg-primary hover:bg-sky-600 text-white font-semibold py-4 px-6 rounded-xl shadow-lg shadow-primary/20 transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                            >
                                {generating ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Generating ZIP...
                                    </>
                                ) : (
                                    <>
                                        <Download className="w-5 h-5" />
                                        Download QTI ZIP
                                    </>
                                )}
                            </button>

                            <button
                                onClick={() => {
                                    if (!questions.length) return;
                                    const xmlContent = generateQTIXML(questions);
                                    const blob = new Blob([xmlContent], { type: 'text/xml;charset=utf-8' });
                                    const url = URL.createObjectURL(blob);
                                    const a = document.createElement('a');
                                    a.href = url;
                                    a.download = `${file?.name.replace(/\.[^/.]+$/, "")}_qti.xml`;
                                    document.body.appendChild(a);
                                    a.click();
                                    document.body.removeChild(a);
                                    URL.revokeObjectURL(url);
                                }}
                                disabled={generating}
                                className="flex-1 bg-white hover:bg-slate-50 text-slate-700 border-2 border-slate-200 font-semibold py-4 px-6 rounded-xl transition-all hover:border-primary/50 flex items-center justify-center gap-3"
                            >
                                <FileCode className="w-5 h-5 text-slate-500" />
                                Download XML Only
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
