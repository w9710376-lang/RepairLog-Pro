const fs = require('fs');

let detailCode = fs.readFileSync('src/pages/JobDetail.tsx', 'utf-8');

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
                  {(job.partsUsed || []).map((part, index) => (
                    <tr key={index} className="border-b border-slate-50">
                      <td className="py-2 font-medium text-slate-800">{part.name}</td>
                      <td className="py-2 text-right text-slate-600">{part.quantity}</td>
                      <td className="py-2 text-right text-slate-600">\${(part.cost * part.quantity).toFixed(2)}</td>`,
  `              <table className="w-full text-left text-sm mb-4">
                <thead>
                  <tr className="text-[10px] text-slate-400 border-b border-slate-100">
                    <th className="pb-2 font-bold">ITEM</th>
                    <th className="pb-2 text-right font-bold">QTY</th>
                    <th className="pb-2 text-right font-bold">UNIT COST</th>
                    <th className="pb-2 text-right font-bold">TOTAL</th>
                    {canEdit && <th className="pb-2"></th>}
                  </tr>
                </thead>
                <tbody>
                  {(job.partsUsed || []).map((part, index) => (
                    <tr key={index} className="border-b border-slate-50">
                      <td className="py-2 font-medium text-slate-800">{part.name}</td>
                      <td className="py-2 text-right text-slate-600">{part.quantity}</td>
                      <td className="py-2 text-right text-slate-600">\${part.cost.toFixed(2)}</td>
                      <td className="py-2 text-right text-slate-600">\${(part.cost * part.quantity).toFixed(2)}</td>`
);


detailCode = detailCode.replace(
  `                <div className="flex gap-2 pt-4 border-t border-slate-100">
                  <input 
                    type="text" 
                    placeholder="Part name" 
                    value={newPart.name} 
                    onChange={e => setNewPart({...newPart, name: e.target.value})}
                    onKeyDown={e => e.key === 'Enter' && addPart()}
                    className="flex-1 px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded"
                  />
                  <input 
                    type="number" 
                    placeholder="Cost" 
                    value={newPart.cost || ''} 
                    onChange={e => setNewPart({...newPart, cost: Number(e.target.value)})}
                    onKeyDown={e => e.key === 'Enter' && addPart()}
                    className="w-24 px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded"
                  />
                  <input 
                    type="number" 
                    placeholder="Qty" 
                    value={newPart.quantity || ''} 
                    onChange={e => setNewPart({...newPart, quantity: Number(e.target.value)})}
                    onKeyDown={e => e.key === 'Enter' && addPart()}
                    className="w-16 px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded"
                  />`,
  `                <div className="flex gap-2 pt-4 border-t border-slate-100">
                  <input 
                    type="text" 
                    placeholder="Part name" 
                    value={newPart.name} 
                    onChange={e => setNewPart({...newPart, name: e.target.value})}
                    onKeyDown={e => e.key === 'Enter' && addPart()}
                    className="flex-1 px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded"
                  />
                  <input 
                    type="number" 
                    placeholder="Qty" 
                    value={newPart.quantity === 0 ? '' : newPart.quantity} 
                    onChange={e => setNewPart({...newPart, quantity: Number(e.target.value)})}
                    onKeyDown={e => e.key === 'Enter' && addPart()}
                    className="w-20 px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded"
                  />
                  <input 
                    type="number" 
                    placeholder="Unit Cost" 
                    value={newPart.cost === 0 ? '' : newPart.cost} 
                    onChange={e => setNewPart({...newPart, cost: Number(e.target.value)})}
                    onKeyDown={e => e.key === 'Enter' && addPart()}
                    className="w-24 px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded"
                  />`
);

fs.writeFileSync('src/pages/JobDetail.tsx', detailCode);
