const fs = require('fs');
let code = fs.readFileSync('src/pages/JobDetail.tsx', 'utf-8');

const functions = `
  const handleRemovePhoto = async (indexToRemove) => {
    if (!job || !id) return;
    if (!window.confirm("Are you sure you want to remove this photo?")) return;
    try {
      const updatedPhotos = job.photos.filter((_, i) => i !== indexToRemove);
      await handleUpdate('photos', updatedPhotos);
    } catch (error) {
      console.error("Error removing photo:", error);
    }
  };

  const handleRemoveDocument = async (idToRemove) => {
    if (!job || !id || !job.attachments) return;
    if (!window.confirm("Are you sure you want to remove this document?")) return;
    try {
      const updatedAttachments = job.attachments.filter(doc => doc.id !== idToRemove);
      await handleUpdate('attachments', updatedAttachments);
    } catch (error) {
      console.error("Error removing document:", error);
    }
  };
`;

code = code.replace(
  `  const [uploadingDoc, setUploadingDoc] = useState(false);`,
  functions + `\n  const [uploadingDoc, setUploadingDoc] = useState(false);`
);

fs.writeFileSync('src/pages/JobDetail.tsx', code);
