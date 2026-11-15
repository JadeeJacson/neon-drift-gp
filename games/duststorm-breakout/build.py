from pathlib import Path
import re
p=Path(__file__).resolve().parent
original=(p/'template.html').read_text()
js=(p/'src/game.js').read_text().rstrip()
js=re.sub(r'renderGarage\(\);\s*requestAnimationFrame\(frame\);\s*$', '', js)
for name in ['expedition','horde','mutants','boss','endless','chains','meta']:
    js=js+'\n'+(p/f'src/{name}.js').read_text().rstrip()+'\n'
js=js+'\nrenderGarage();\nrequestAnimationFrame(frame);\n'
css=(p/'src/styles.css').read_text()+'\n'+(p/'src/expedition.css').read_text()
html=re.sub(r'<style>[\s\S]*?</style>',lambda m:'<style>\n'+css+'\n</style>',original,count=1)
html=re.sub(r'<script>[\s\S]*?</script>',lambda m:'<script>\n'+js+'\n</script>',html,count=1)
html=html.replace('尘暴突围 2.1 · DUST RUN','尘暴突围 2.3 · 尸潮觉醒 / DUST RUN')
(p/'index.html').write_text(html)
print('Built offline index.html:',(p/'index.html').stat().st_size,'bytes')
