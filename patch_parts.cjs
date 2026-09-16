const fs = require('fs');

let detailCode = fs.readFileSync('src/pages/JobDetail.tsx', 'utf-8');

// 1. Fix fetchJob
detailCode = detailCode.replace(
  `        if (docSnap.exists()) {
          setJob({ id: docSnap.id, ...docSnap.data() } as unknown as Job);`,
  `        if (docSnap.exists()) {
          const data = docSnap.data();
          setJob({ 
            id: docSnap.id, 
            partsUsed: [], 
            photos: [], 
            attachments: [], 
            resolutionNotes: '', 
            ...data 
          } as unknown as Job);`
);

// 2. Fix handleUpdate profile check
detailCode = detailCode.replace(
  `  const handleUpdate = async (field: keyof Job, value: any) => {
    if (!job || !id || !profile) return;`,
  `  const handleUpdate = async (field: keyof Job, value: any) => {
    if (!job || !id) return;
    if (!profile) {
      alert("Your user profile is loading. Please wait a moment and try again.");
      return;
    }`
);

// 3. Fix addPart
detailCode = detailCode.replace(
  `  const addPart = async () => {
    if (!job || !id || !newPart.name) return;
    const updatedParts = [...job.partsUsed, newPart];
    await handleUpdate('partsUsed', updatedParts);
    setNewPart({ name: '', cost: 0, quantity: 1 });
  };`,
  `  const addPart = async () => {
    if (!job || !id) return;
    if (!newPart.name.trim()) {
      alert("Please enter a part name.");
      return;
    }
    const currentParts = job.partsUsed || [];
    const updatedParts = [...currentParts, newPart];
    await handleUpdate('partsUsed', updatedParts);
    setNewPart({ name: '', cost: 0, quantity: 1 });
  };`
);

// 4. Add onKeyDown and type="button"
detailCode = detailCode.replace(
  `                  <input 
                    type="text" 
                    placeholder="Part name" 
                    value={newPart.name} 
                    onChange={e => setNewPart({...newPart, name: e.target.value})}
                    className="flex-1 px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded"
                  />`,
  `                  <input 
                    type="text" 
                    placeholder="Part name" 
                    value={newPart.name} 
                    onChange={e => setNewPart({...newPart, name: e.target.value})}
                    onKeyDown={e => e.key === 'Enter' && addPart()}
                    className="flex-1 px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded"
                  />`
);

detailCode = detailCode.replace(
  `                  <input 
                    type="number" 
                    placeholder="Cost" 
                    value={newPart.cost || ''} 
                    onChange={e => setNewPart({...newPart, cost: Number(e.target.value)})}
                    className="w-24 px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded"
                  />`,
  `                  <input 
                    type="number" 
                    placeholder="Cost" 
                    value={newPart.cost || ''} 
                    onChange={e => setNewPart({...newPart, cost: Number(e.target.value)})}
                    onKeyDown={e => e.key === 'Enter' && addPart()}
                    className="w-24 px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded"
                  />`
);

detailCode = detailCode.replace(
  `                  <input 
                    type="number" 
                    placeholder="Qty" 
                    value={newPart.quantity || ''} 
                    onChange={e => setNewPart({...newPart, quantity: Number(e.target.value)})}
                    className="w-16 px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded"
                  />`,
  `                  <input 
                    type="number" 
                    placeholder="Qty" 
                    value={newPart.quantity || ''} 
                    onChange={e => setNewPart({...newPart, quantity: Number(e.target.value)})}
                    onKeyDown={e => e.key === 'Enter' && addPart()}
                    className="w-16 px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded"
                  />`
);

detailCode = detailCode.replace(
  `                  <button onClick={addPart} className="bg-blue-100 text-blue-700 p-2 rounded hover:bg-blue-200">
                    <Plus className="w-4 h-4" />
                  </button>`,
  `                  <button type="button" onClick={addPart} className="bg-blue-100 text-blue-700 p-2 rounded hover:bg-blue-200">
                    <Plus className="w-4 h-4" />
                  </button>`
);

// 5. Ensure rendering logic falls back to empty array
detailCode = detailCode.replace(
  `              <table className="w-full text-left text-sm mb-4">
                <thead>
                  <tr className="text-[10px] text-slate-400 border-b border-slate-100">
                    <th className="pb-2 font-bold">ITEM</th>
                    <th className="pb-2 text-right font-bold">QTY</th>
                    <th className="pb-2 text-right font-bold">COST</th>
                    {canEdit && <th className="pb-2"></th>}
                  </tr>
                </thead>
                <tbody>
                  {job.partsUsed.map((part, index) => (`,
  `              <table className="w-full text-left text-sm mb-4">
                <thead>
                  <tr className="text-[10px] text-slate-400 border-b border-slate-100">
                    <th className="pb-2 font-bold">ITEM</th>
                    <th className="pb-2 text-right font-bold">QTY</th>
                    <th className="pb-2 text-right font-bold">COST</th>
                    {canEdit && <th className="pb-2"></th>}
                  </tr>
                </thead>
                <tbody>
                  {(job.partsUsed || []).map((part, index) => (`
);

detailCode = detailCode.replace(
  `              {job.partsUsed.length > 0 && (
                <div className="flex justify-end text-sm font-bold text-slate-800 mb-4">
                  Total Parts: \${totalCost.toFixed(2)}
                </div>
              )}
              {job.partsUsed.length === 0 && <p className="text-sm text-slate-500 mb-4">No parts recorded.</p>}`,
  `              {(job.partsUsed || []).length > 0 && (
                <div className="flex justify-end text-sm font-bold text-slate-800 mb-4">
                  Total Parts: \${totalCost.toFixed(2)}
                </div>
              )}
              {(job.partsUsed || []).length === 0 && <p className="text-sm text-slate-500 mb-4">No parts recorded.</p>}`
);


fs.writeFileSync('src/pages/JobDetail.tsx', detailCode);
