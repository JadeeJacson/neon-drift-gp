from pathlib import Path
import re,json
r=Path(__file__).resolve().parent
h=(r/'index.html').read_text()
for name in ['three.min.js','system.js','game.js','expansion.js','orbits.js','singularities.js','cosmos.js','lore.js','quantum.js','goals.js','touch.js','wilds.js']:
    h=h.replace(f'<script src="{name}"></script>','<script>\n'+(r/name).read_text().replace('</script','<\\/script')+'\n</script>')
h=h.replace('<head>','<head>\n<!-- Three.js MIT License: '+(r/'LICENSE-THREE.txt').read_text()+' -->')
(r/'逐星-折叠航路0.9.html').write_text(h)
print('Built',len(h.encode()),'bytes')
