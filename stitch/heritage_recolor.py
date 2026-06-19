#!/usr/bin/env python3
"""One-shot recolor: map legacy purple/blue/indigo/orange Tailwind classes to the
Heritage Tech green/gold ramps. Preserves variants (hover:, md:, dark:), utility
prefixes, and opacity suffixes (e.g. /30). Red/rose/pink left alone (error states)."""
import re, glob

PREFIXES = (r'(?:bg|text|border|ring|ring-offset|shadow|from|via|to|fill|stroke'
            r'|divide|outline|decoration|accent|caret|placeholder)')

primary = {  # purple / violet / fuchsia  -> deep green
    '50':'e9f1e2','100':'d3e6c8','200':'aecf9c','300':'7fb56a','400':'3f9a37',
    '500':'0b7a3b','600':'006400','700':'004f00','800':'003c00','900':'002a00','950':'001b00'}
secondary = {  # blue / indigo / sky / cyan -> forest green
    '50':'e6f3ec','100':'c7ecd6','200':'97e0b4','300':'66d394','400':'25b35f',
    '500':'109a48','600':'006d33','700':'005728','800':'00421f','900':'002d15','950':'001c0d'}
gold = {  # orange / amber / yellow -> royal gold
    '50':'fcf7e6','100':'f7edc4','200':'efd98a','300':'e6c552','400':'d7b01f',
    '500':'c59f00','600':'a98700','700':'876b00','800':'655100','900':'463800','950':'2c2300'}

family = {}
for c in ('purple','violet','fuchsia'): family[c] = primary
for c in ('blue','indigo','sky','cyan'): family[c] = secondary
for c in ('orange','amber','yellow'):    family[c] = gold

colors = '|'.join(family)
pat = re.compile(rf'({PREFIXES}-)({colors})-(\d{{2,3}})')

def repl(m):
    prefix, color, shade = m.group(1), m.group(2), m.group(3)
    ramp = family[color]
    return f'{prefix}[#{ramp[shade]}]' if shade in ramp else m.group(0)

files = glob.glob('app/**/*.tsx', recursive=True) + glob.glob('components/**/*.tsx', recursive=True)
total, touched = 0, 0
for f in files:
    s = open(f, encoding='utf-8').read()
    ns, n = pat.subn(repl, s)
    if n:
        open(f, 'w', encoding='utf-8', newline='').write(ns)
        total += n; touched += 1
        print(f'{n:3d}  {f}')
print(f'--- {total} replacements across {touched} files ---')
