const fs = require('fs');

const fixErrorString = (code) => {
  return code.replace(
    /error\?\.message\?\.includes\("too large"\)/g,
    'error?.message?.includes("too large") || error?.message?.includes("exceeds the maximum allowed size") || error?.message?.includes("exceeds")'
  );
};

['src/pages/JobCreate.tsx', 'src/pages/JobEdit.tsx', 'src/pages/JobDetail.tsx'].forEach(file => {
  let code = fs.readFileSync(file, 'utf-8');
  code = fixErrorString(code);
  fs.writeFileSync(file, code);
});

let imageCode = fs.readFileSync('src/lib/imageUtils.ts', 'utf-8');
imageCode = imageCode.replace('const MAX_SIZE = 800;', 'const MAX_SIZE = 600;');
imageCode = imageCode.replace('resolve(canvas.toDataURL(\'image/jpeg\', 0.5));', 'resolve(canvas.toDataURL(\'image/jpeg\', 0.4));');
fs.writeFileSync('src/lib/imageUtils.ts', imageCode);
