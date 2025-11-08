#!/usr/bin/env python3
"""
Generate EDITABLE SVG versions of all diagrams for future modifications
"""

import os
from graphviz import Digraph

base_path = '/home/runner/work/rster/rster/Documentation'
output_dir = f'{base_path}/diagrams_editable'
os.makedirs(output_dir, exist_ok=True)

print("Generating EDITABLE SVG diagrams...\n")

# Use Case Diagram - SVG
ucd = Digraph('Use_Case_Diagram', format='svg')
ucd.attr(rankdir='LR', size='16,12')
ucd.attr('node', shape='rectangle', style='rounded', fontname='Arial')

with ucd.subgraph(name='cluster_0') as system:
    system.attr(label='RosterBhai System', style='dashed', color='blue', fontsize='16')
    for i in range(1, 23):
        system.node(f'UC{i:02d}', f'Use Case {i}')

ucd.attr('node', shape='box', style='filled', fillcolor='lightyellow', fontsize='12')
ucd.node('company', '<<ACTOR>>\\nCompany')
ucd.node('developer', '<<ACTOR>>\\nDeveloper')
ucd.node('admin', '<<ACTOR>>\\nAdmin')
ucd.node('employee', '<<ACTOR>>\\nEmployee')

ucd.render(f'{output_dir}/Use_Case_Diagram', cleanup=True)
print("✓ Use Case Diagram (SVG) generated")

# Context DFD - SVG
dfd = Digraph('Context_DFD', format='svg')
dfd.attr(rankdir='TB', size='14,10')
dfd.node('system', 'RosterBhai\\nSystem', shape='circle', style='filled', fillcolor='lightblue')
dfd.attr('node', shape='box', style='filled', fillcolor='lightyellow')
for entity in ['company', 'developer', 'admin', 'employee', 'google']:
    dfd.node(entity, entity.capitalize())
dfd.render(f'{output_dir}/Context_DFD', cleanup=True)
print("✓ Context DFD (SVG) generated")

# Level 1 DFD - SVG (NO VERSION NUMBERS)
dfd1 = Digraph('Level1_DFD', format='svg')
dfd1.attr(rankdir='TB', size='16,14')
dfd1.attr('node', shape='circle', style='filled', fillcolor='lightblue', fontsize='11')
processes = ['User\\nAuthentication', 'Tenant\\nManagement', 'Employee\\nManagement',
             'Roster\\nManagement', 'Schedule Request\\nManagement',
             'Notification\\nManagement', 'Reporting &\\nAnalytics']
for i, proc in enumerate(processes, 1):
    dfd1.node(f'P{i}', proc, width='1.5')
dfd1.render(f'{output_dir}/Level1_DFD', cleanup=True)
print("✓ Level 1 DFD (SVG) generated - NO VERSION NUMBERS")

# System Architecture - SVG
arch = Digraph('System_Architecture', format='svg')
arch.attr(rankdir='TB', size='14,12')
with arch.subgraph(name='cluster_presentation') as p:
    p.attr(label='Presentation Layer', style='filled', color='lightblue')
    p.node('landing', 'Landing Page', shape='box')
with arch.subgraph(name='cluster_business') as b:
    b.attr(label='Business Logic Layer', style='filled', color='lightyellow')
    b.node('auth_api', 'Auth APIs', shape='box')
with arch.subgraph(name='cluster_data') as d:
    d.attr(label='Data Layer', style='filled', color='lightcoral')
    d.node('dev_db', 'developers.json', shape='cylinder')
arch.render(f'{output_dir}/System_Architecture', cleanup=True)
print("✓ System Architecture (SVG) generated")

# ER Diagram - SVG
er = Digraph('ER_Diagram', format='svg')
er.attr(rankdir='LR', size='16,10')
er.attr('node', shape='box', style='filled', fillcolor='lightblue')
entities = ['Tenant', 'Employee', 'Admin', 'Developer', 'ScheduleRequest', 'RosterData']
for entity in entities:
    er.node(entity, entity)
er.render(f'{output_dir}/ER_Diagram', cleanup=True)
print("✓ ER Diagram (SVG) generated")

print(f"\n✓ All EDITABLE SVG diagrams generated!")
print(f"  Location: {output_dir}/")
print("\nThese SVG files can be edited in:")
print("  - Adobe Illustrator")
print("  - Inkscape (free)")
print("  - Lucidchart (import SVG)")
print("  - Any vector graphics editor")
