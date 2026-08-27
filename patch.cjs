const fs = require('fs');
let code = fs.readFileSync('src/pages/JobDetail.tsx', 'utf-8');

code = code.replace(
  `  const [uploadingDoc, setUploadingDoc] = useState(false);\n  const handleDocumentChange = async (e: React.ChangeEvent<HTMLInputElement>) => {`,
  `  const handleRemovePhoto = async (indexToRemove: number) => {
    if (!job || !id) return;
    if (!window.confirm("Are you sure you want to remove this photo?")) return;
    try {
      const updatedPhotos = job.photos.filter((_, i) => i !== indexToRemove);
      await handleUpdate('photos', updatedPhotos);
    } catch (error) {
      console.error("Error removing photo:", error);
    }
  };

  const handleRemoveDocument = async (idToRemove: string) => {
    if (!job || !id || !job.attachments) return;
    if (!window.confirm("Are you sure you want to remove this document?")) return;
    try {
      const updatedAttachments = job.attachments.filter(doc => doc.id !== idToRemove);
      await handleUpdate('attachments', updatedAttachments);
    } catch (error) {
      console.error("Error removing document:", error);
    }
  };

  const [uploadingDoc, setUploadingDoc] = useState(false);
  const handleDocumentChange = async (e: React.ChangeEvent<HTMLInputElement>) => {`
);

code = code.replace(
`  const handleDocumentChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!job || !id || !file) return;

    if (file.size > 800 * 1024) {
      alert("File is too large. Maximum size is 800KB for offline-first documents.");
      e.target.value = '';
      return;
    }
    
    setUploadingDoc(true);
    try {
      const base64Str = await fileToBase64(file);
      const newAttachment = {
        id: Date.now().toString(),
        name: file.name,
        type: file.type || 'application/octet-stream',
        size: file.size,
        data: base64Str
      };
      const updatedAttachments = [...(job.attachments || []), newAttachment];
      await handleUpdate('attachments', updatedAttachments);
    } catch (error) {
      console.error("Error uploading document:", error);
      alert("Failed to process document.");
    } finally {
      setUploadingDoc(false);
      e.target.value = '';
    }
  };`,
`  const handleDocumentChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!job || !id || files.length === 0) return;

    const validFiles = files.filter(file => {
      if (file.size > 800 * 1024) {
        alert("File " + file.name + " is too large. Maximum size is 800KB.");
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) {
      e.target.value = '';
      return;
    }
    
    setUploadingDoc(true);
    try {
      const newAttachments = await Promise.all(validFiles.map(async (file, index) => {
        const base64Str = await fileToBase64(file);
        return {
          id: Date.now().toString() + index,
          name: file.name,
          type: file.type || 'application/octet-stream',
          size: file.size,
          data: base64Str
        };
      }));
      const updatedAttachments = [...(job.attachments || []), ...newAttachments];
      await handleUpdate('attachments', updatedAttachments);
    } catch (error) {
      console.error("Error uploading document:", error);
      alert("Failed to process document.");
    } finally {
      setUploadingDoc(false);
      e.target.value = '';
    }
  };`
);

code = code.replace(
`  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!job || !id || !file) return;
    
    setUploadingImage(true);
    try {
      const base64Str = await compressImage(file);
      const updatedPhotos = [...job.photos, base64Str];
      await handleUpdate('photos', updatedPhotos);
    } catch (error) {
      console.error("Error compressing image:", error);
      alert("Failed to process image.");
    } finally {
      setUploadingImage(false);
      e.target.value = '';
    }
  };`,
`  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!job || !id || files.length === 0) return;
    
    setUploadingImage(true);
    try {
      const newPhotos = await Promise.all(files.map(compressImage));
      const updatedPhotos = [...job.photos, ...newPhotos];
      await handleUpdate('photos', updatedPhotos);
    } catch (error) {
      console.error("Error compressing image:", error);
      alert("Failed to process image.");
    } finally {
      setUploadingImage(false);
      e.target.value = '';
    }
  };`
);

// update UI logic:
code = code.replace(
`                    <div 
                      key={index} 
                      className="relative aspect-square bg-slate-200 rounded-md border border-slate-300 flex items-center justify-center overflow-hidden group cursor-pointer"
                      onClick={() => setSelectedImage(url)}
                    >
                      <img src={url} alt={\`Job \${index}\`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    </div>`,
`                    <div 
                      key={index} 
                      className="relative aspect-square bg-slate-200 rounded-md border border-slate-300 flex items-center justify-center overflow-hidden group cursor-pointer"
                      onClick={() => setSelectedImage(url)}
                    >
                      <img src={url} alt={\`Job \${index}\`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      {canEdit && (
                        <button 
                          type="button"
                          onClick={(e) => { e.stopPropagation(); handleRemovePhoto(index); }}
                          className="absolute top-1.5 right-1.5 bg-white p-1.5 rounded-full text-slate-600 hover:bg-red-50 hover:text-red-600 shadow-md opacity-100 transition-all border border-slate-200"
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </button>
                      )}
                    </div>`
);

code = code.replace(
`                      <div className="text-slate-400 group-hover:text-blue-600 px-2 shrink-0">
                        <Download className="w-4 h-4" />
                      </div>
                    </a>`,
`                      <div className="flex items-center gap-2 px-2 shrink-0">
                        <div className="text-slate-400 group-hover:text-blue-600 p-2">
                          <Download className="w-4 h-4" />
                        </div>
                        {canEdit && (
                          <button
                            type="button"
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleRemoveDocument(doc.id || idx.toString()); }}
                            className="text-slate-400 hover:text-red-600 p-2 transition-colors"
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </button>
                        )}
                      </div>
                    </a>`
);

code = code.replace(
`                      accept="image/*"
                      capture="environment"`,
`                      accept="image/*"
                      multiple`
);

code = code.replace(
`                      accept=".pdf,.doc,.docx,.xls,.xlsx,.txt"
                      id="doc-upload-detail"`,
`                      accept=".pdf,.doc,.docx,.xls,.xlsx,.txt"
                      multiple
                      id="doc-upload-detail"`
);

fs.writeFileSync('src/pages/JobDetail.tsx', code);
