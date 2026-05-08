const fs = require('fs');
const file = './src/screens/auth/DriverRegistrationScreen.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/quality:\s*0\.5,/, 'quality: 0.5,\n        base64: true,');
content = content.replace(/setter\(result\.assets\[0\]\.uri\);/, 'setter(`data:image/jpeg;base64,${result.assets[0].base64}`);');

fs.writeFileSync(file, content);
console.log('Fixed Base64 images for Driver Registration');
