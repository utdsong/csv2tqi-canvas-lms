import JSZip from 'jszip';

/**
 * Creates a ZIP package containing ONLY the QTI XML file.
 * This adheres to the user's specific request to "only have the .xml in the zip".
 * Compatible with Canvas "QTI .zip" import (which accepts simple zips of XMLs).
 */
export async function createCanvasPackage(assessmentXml: string, filename: string = 'assessment_qti.xml'): Promise<Blob> {
  const zip = new JSZip();

  // User requested: "we only need the .xml in the zip and not many .xml file"
  // So we will just zip the QTI XML file itself.

  zip.file(filename, assessmentXml);

  return await zip.generateAsync({ type: 'blob' });
}
