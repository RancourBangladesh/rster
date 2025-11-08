#!/usr/bin/env python3
"""
Generate Use Case and Data Flow Diagrams for RosterBhai
"""

import os
from graphviz import Digraph

def create_use_case_diagram():
    """Create Use Case Diagram using Graphviz"""
    ucd = Digraph('RosterBhai_Use_Case_Diagram', format='png')
    ucd.attr(rankdir='LR', size='16,12')
    ucd.attr('node', shape='rectangle', style='rounded', fontname='Arial')
    
    # System boundary
    with ucd.subgraph(name='cluster_0') as system:
        system.attr(label='RosterBhai System', style='dashed', color='blue', fontsize='16')
        
        # Use cases
        system.node('UC01', 'Browse Landing Page')
        system.node('UC02', 'Register for Service')
        system.node('UC03', 'Login to Developer Portal')
        system.node('UC04', 'Approve Tenant')
        system.node('UC05', 'Manage Tenant')
        system.node('UC06', 'Edit Landing CMS')
        system.node('UC07', 'Login to Admin Panel')
        system.node('UC08', 'Add Employee')
        system.node('UC09', 'Import CSV Roster')
        system.node('UC10', 'Sync Google Sheets')
        system.node('UC11', 'Modify Employee Shift')
        system.node('UC12', 'Create Shift Template')
        system.node('UC13', 'Approve Schedule Request')
        system.node('UC14', 'Configure Organization')
        system.node('UC15', 'Manage Admin Users (RBAC)')
        system.node('UC16', 'Login to Employee Portal')
        system.node('UC17', 'View Personal Schedule')
        system.node('UC18', 'View Team Schedule')
        system.node('UC19', 'Submit Shift Change Request')
        system.node('UC20', 'Submit Shift Swap Request')
        system.node('UC21', 'View Notifications')
        system.node('UC22', 'Update Profile')
    
    # Actors
    ucd.attr('node', shape='box', style='filled', fillcolor='lightyellow', fontsize='12')
    ucd.node('company', '<<ACTOR>>\nCompany')
    ucd.node('developer', '<<ACTOR>>\nDeveloper')
    ucd.node('admin', '<<ACTOR>>\nAdmin')
    ucd.node('employee', '<<ACTOR>>\nEmployee')
    
    # Company relationships
    ucd.edge('company', 'UC01')
    ucd.edge('company', 'UC02')
    
    # Developer relationships
    ucd.edge('developer', 'UC03')
    ucd.edge('developer', 'UC04')
    ucd.edge('developer', 'UC05')
    ucd.edge('developer', 'UC06')
    
    # Admin relationships
    ucd.edge('admin', 'UC07')
    ucd.edge('admin', 'UC08')
    ucd.edge('admin', 'UC09')
    ucd.edge('admin', 'UC10')
    ucd.edge('admin', 'UC11')
    ucd.edge('admin', 'UC12')
    ucd.edge('admin', 'UC13')
    ucd.edge('admin', 'UC14')
    ucd.edge('admin', 'UC15')
    
    # Employee relationships
    ucd.edge('employee', 'UC16')
    ucd.edge('employee', 'UC17')
    ucd.edge('employee', 'UC18')
    ucd.edge('employee', 'UC19')
    ucd.edge('employee', 'UC20')
    ucd.edge('employee', 'UC21')
    ucd.edge('employee', 'UC22')
    
    # Save diagram
    output_path = '/home/runner/work/rster/rster/Documentation/diagrams/Use_Case_Diagram'
    ucd.render(output_path, cleanup=True)
    print(f"✓ Use Case Diagram saved to {output_path}.png")

def create_context_dfd():
    """Create Level 0 Context DFD"""
    dfd = Digraph('RosterBhai_Context_DFD', format='png')
    dfd.attr(rankdir='TB', size='14,10')
    
    # Main system
    dfd.node('system', 'RosterBhai\nSystem', shape='circle', style='filled', fillcolor='lightblue', fontsize='14', width='2.5')
    
    # External entities
    dfd.attr('node', shape='box', style='filled', fillcolor='lightyellow')
    dfd.node('company', 'Company')
    dfd.node('developer', 'Developer')
    dfd.node('admin', 'Admin')
    dfd.node('employee', 'Employee')
    dfd.node('google', 'Google Sheets')
    
    # Data flows
    dfd.edge('company', 'system', label='Registration Data', fontsize='10')
    dfd.edge('system', 'company', label='Subscription Status', fontsize='10')
    
    dfd.edge('developer', 'system', label='Tenant Management\nCMS Updates', fontsize='10')
    dfd.edge('system', 'developer', label='Tenant Reports\nAnalytics', fontsize='10')
    
    dfd.edge('admin', 'system', label='Roster Data\nEmployee Data\nCSV Files', fontsize='10')
    dfd.edge('system', 'admin', label='Dashboard\nRequests\nAudit Logs', fontsize='10')
    
    dfd.edge('employee', 'system', label='Schedule Requests\nProfile Updates', fontsize='10')
    dfd.edge('system', 'employee', label='Schedules\nNotifications', fontsize='10')
    
    dfd.edge('google', 'system', label='Roster Data (CSV)', fontsize='10')
    dfd.edge('system', 'google', label='Sync Request', fontsize='10')
    
    output_path = '/home/runner/work/rster/rster/Documentation/diagrams/Context_DFD'
    dfd.render(output_path, cleanup=True)
    print(f"✓ Context DFD saved to {output_path}.png")

def create_level1_dfd():
    """Create Level 1 DFD showing main processes"""
    dfd = Digraph('RosterBhai_Level1_DFD', format='png')
    dfd.attr(rankdir='TB', size='16,14')
    
    # Processes (circles) - NO VERSION NUMBERS
    dfd.attr('node', shape='circle', style='filled', fillcolor='lightblue', fontsize='11')
    dfd.node('P1', 'User\nAuthentication', width='1.5')
    dfd.node('P2', 'Tenant\nManagement', width='1.5')
    dfd.node('P3', 'Employee\nManagement', width='1.5')
    dfd.node('P4', 'Roster\nManagement', width='1.5')
    dfd.node('P5', 'Schedule Request\nManagement', width='1.5')
    dfd.node('P6', 'Notification\nManagement', width='1.5')
    dfd.node('P7', 'Reporting &\nAnalytics', width='1.5')
    
    # External entities
    dfd.attr('node', shape='box', style='filled', fillcolor='lightyellow', fontsize='10')
    dfd.node('company', 'Company')
    dfd.node('developer', 'Developer')
    dfd.node('admin', 'Admin')
    dfd.node('employee', 'Employee')
    dfd.node('google', 'Google Sheets')
    
    # Data stores (parallel lines)
    dfd.attr('node', shape='cylinder', style='filled', fillcolor='lightgray', fontsize='9')
    dfd.node('DS1', 'developers.json')
    dfd.node('DS2', 'tenants.json')
    dfd.node('DS3', 'admin_data.json')
    dfd.node('DS4', 'employee_data.json')
    dfd.node('DS5', 'roster_data.json')
    dfd.node('DS6', 'schedule_requests.json')
    dfd.node('DS7', 'modified_shifts.json')
    dfd.node('DS8', 'google_data.json')
    
    # Authentication flows
    dfd.edge('developer', 'P1', label='Login', fontsize='8')
    dfd.edge('admin', 'P1', label='Login', fontsize='8')
    dfd.edge('employee', 'P1', label='Login', fontsize='8')
    dfd.edge('P1', 'DS1', dir='both', label='Dev Auth', fontsize='8')
    dfd.edge('P1', 'DS3', dir='both', label='Admin Auth', fontsize='8')
    dfd.edge('P1', 'DS4', dir='both', label='Emp Auth', fontsize='8')
    
    # Tenant management flows
    dfd.edge('company', 'P2', label='Registration', fontsize='8')
    dfd.edge('developer', 'P2', label='Manage', fontsize='8')
    dfd.edge('P2', 'DS2', dir='both', label='Tenant Data', fontsize='8')
    dfd.edge('P2', 'company', label='Status', fontsize='8')
    
    # Employee management flows
    dfd.edge('admin', 'P3', label='Employee CRUD', fontsize='8')
    dfd.edge('P3', 'DS5', dir='both', label='Employee List', fontsize='8')
    dfd.edge('P3', 'DS4', dir='both', label='Credentials', fontsize='8')
    
    # Roster management flows
    dfd.edge('admin', 'P4', label='CSV/Manual', fontsize='8')
    dfd.edge('google', 'P4', label='Roster CSV', fontsize='8')
    dfd.edge('P4', 'DS5', dir='both', label='Roster', fontsize='8')
    dfd.edge('P4', 'DS8', dir='both', label='Links', fontsize='8')
    dfd.edge('P4', 'DS7', label='Audit', fontsize='8')
    dfd.edge('P4', 'admin', label='Display', fontsize='8')
    dfd.edge('P4', 'employee', label='Schedule', fontsize='8')
    
    # Schedule request flows
    dfd.edge('employee', 'P5', label='Requests', fontsize='8')
    dfd.edge('admin', 'P5', label='Approve/Reject', fontsize='8')
    dfd.edge('P5', 'DS6', dir='both', label='Requests', fontsize='8')
    dfd.edge('P5', 'P4', label='Update if Approved', fontsize='8')
    dfd.edge('P5', 'P6', label='Trigger Notif', fontsize='8')
    
    # Notification flows
    dfd.edge('P6', 'employee', label='Notifications', fontsize='8')
    dfd.edge('P6', 'admin', label='Alerts', fontsize='8')
    
    # Reporting flows
    dfd.edge('P7', 'DS7', label='Read Audit', fontsize='8')
    dfd.edge('P7', 'DS6', label='Read Requests', fontsize='8')
    dfd.edge('P7', 'admin', label='Reports', fontsize='8')
    dfd.edge('P7', 'developer', label='Analytics', fontsize='8')
    
    output_path = '/home/runner/work/rster/rster/Documentation/diagrams/Level1_DFD'
    dfd.render(output_path, cleanup=True)
    print(f"✓ Level 1 DFD saved to {output_path}.png")

def create_architecture_diagram():
    """Create System Architecture Diagram"""
    arch = Digraph('RosterBhai_Architecture', format='png')
    arch.attr(rankdir='TB', size='14,12')
    
    # Presentation Layer
    with arch.subgraph(name='cluster_presentation') as p:
        p.attr(label='Presentation Layer', style='filled', color='lightblue', fontsize='14')
        p.node('landing', 'Landing Page\n(Marketing)', shape='box', style='filled', fillcolor='lightgreen')
        p.node('dev_ui', 'Developer Portal\n(Dashboard)', shape='box', style='filled', fillcolor='lightgreen')
        p.node('admin_ui', 'Admin Panel\n(Tabs Interface)', shape='box', style='filled', fillcolor='lightgreen')
        p.node('emp_ui', 'Employee Portal\n(Schedule View)', shape='box', style='filled', fillcolor='lightgreen')
    
    # Business Logic Layer
    with arch.subgraph(name='cluster_business') as b:
        b.attr(label='Business Logic Layer (Next.js API Routes)', style='filled', color='lightyellow', fontsize='14')
        b.node('auth_api', 'Authentication\nAPIs', shape='box', style='rounded')
        b.node('tenant_api', 'Tenant\nManagement APIs', shape='box', style='rounded')
        b.node('employee_api', 'Employee\nManagement APIs', shape='box', style='rounded')
        b.node('roster_api', 'Roster\nManagement APIs', shape='box', style='rounded')
        b.node('request_api', 'Schedule Request\nAPIs', shape='box', style='rounded')
    
    # Data Layer
    with arch.subgraph(name='cluster_data') as d:
        d.attr(label='Data Layer (JSON File Storage)', style='filled', color='lightcoral', fontsize='14')
        d.node('dev_db', 'developers.json', shape='cylinder', style='filled', fillcolor='white')
        d.node('tenant_db', 'tenants.json', shape='cylinder', style='filled', fillcolor='white')
        d.node('tenant_data', 'Tenant Data Dirs\n(per tenant)', shape='cylinder', style='filled', fillcolor='white')
    
    # External Systems
    arch.node('google_ext', 'Google Sheets', shape='box', style='dashed', color='orange')
    arch.node('smtp_ext', 'Email Server\n(Planned)', shape='box', style='dashed', color='gray')
    
    # Connections - Presentation to Business
    arch.edge('landing', 'tenant_api')
    arch.edge('dev_ui', 'auth_api')
    arch.edge('dev_ui', 'tenant_api')
    arch.edge('admin_ui', 'auth_api')
    arch.edge('admin_ui', 'employee_api')
    arch.edge('admin_ui', 'roster_api')
    arch.edge('admin_ui', 'request_api')
    arch.edge('emp_ui', 'auth_api')
    arch.edge('emp_ui', 'roster_api')
    arch.edge('emp_ui', 'request_api')
    
    # Connections - Business to Data
    arch.edge('auth_api', 'dev_db')
    arch.edge('auth_api', 'tenant_data')
    arch.edge('tenant_api', 'tenant_db')
    arch.edge('tenant_api', 'tenant_data')
    arch.edge('employee_api', 'tenant_data')
    arch.edge('roster_api', 'tenant_data')
    arch.edge('request_api', 'tenant_data')
    
    # External connections
    arch.edge('roster_api', 'google_ext', style='dashed', label='CSV Import')
    arch.edge('request_api', 'smtp_ext', style='dashed', label='Email Notif')
    
    output_path = '/home/runner/work/rster/rster/Documentation/diagrams/System_Architecture'
    arch.render(output_path, cleanup=True)
    print(f"✓ System Architecture Diagram saved to {output_path}.png")

def create_er_diagram():
    """Create Entity Relationship Diagram"""
    er = Digraph('RosterBhai_ER_Diagram', format='png')
    er.attr(rankdir='LR', size='16,10')
    
    # Entities
    er.attr('node', shape='box', style='filled', fillcolor='lightblue', fontsize='10')
    
    # Tenant entity
    er.node('Tenant', '''<
<TABLE BORDER="0" CELLBORDER="1" CELLSPACING="0">
<TR><TD BGCOLOR="navy"><FONT COLOR="white"><B>Tenant</B></FONT></TD></TR>
<TR><TD ALIGN="LEFT">id (PK)</TD></TR>
<TR><TD ALIGN="LEFT">name</TD></TR>
<TR><TD ALIGN="LEFT">slug</TD></TR>
<TR><TD ALIGN="LEFT">is_active</TD></TR>
<TR><TD ALIGN="LEFT">created_at</TD></TR>
</TABLE>>''', shape='none')
    
    # Employee entity
    er.node('Employee', '''<
<TABLE BORDER="0" CELLBORDER="1" CELLSPACING="0">
<TR><TD BGCOLOR="navy"><FONT COLOR="white"><B>Employee</B></FONT></TD></TR>
<TR><TD ALIGN="LEFT">id (PK)</TD></TR>
<TR><TD ALIGN="LEFT">name</TD></TR>
<TR><TD ALIGN="LEFT">currentTeam</TD></TR>
<TR><TD ALIGN="LEFT">schedule[]</TD></TR>
<TR><TD ALIGN="LEFT">status</TD></TR>
</TABLE>>''', shape='none')
    
    # Admin entity
    er.node('Admin', '''<
<TABLE BORDER="0" CELLBORDER="1" CELLSPACING="0">
<TR><TD BGCOLOR="navy"><FONT COLOR="white"><B>Admin</B></FONT></TD></TR>
<TR><TD ALIGN="LEFT">username (PK)</TD></TR>
<TR><TD ALIGN="LEFT">tenant_id (FK)</TD></TR>
<TR><TD ALIGN="LEFT">role</TD></TR>
<TR><TD ALIGN="LEFT">full_name</TD></TR>
</TABLE>>''', shape='none')
    
    # Developer entity
    er.node('Developer', '''<
<TABLE BORDER="0" CELLBORDER="1" CELLSPACING="0">
<TR><TD BGCOLOR="navy"><FONT COLOR="white"><B>Developer</B></FONT></TD></TR>
<TR><TD ALIGN="LEFT">username (PK)</TD></TR>
<TR><TD ALIGN="LEFT">full_name</TD></TR>
<TR><TD ALIGN="LEFT">role</TD></TR>
</TABLE>>''', shape='none')
    
    # ScheduleRequest entity
    er.node('ScheduleRequest', '''<
<TABLE BORDER="0" CELLBORDER="1" CELLSPACING="0">
<TR><TD BGCOLOR="navy"><FONT COLOR="white"><B>ScheduleRequest</B></FONT></TD></TR>
<TR><TD ALIGN="LEFT">id (PK)</TD></TR>
<TR><TD ALIGN="LEFT">employee_id (FK)</TD></TR>
<TR><TD ALIGN="LEFT">type</TD></TR>
<TR><TD ALIGN="LEFT">status</TD></TR>
<TR><TD ALIGN="LEFT">date</TD></TR>
</TABLE>>''', shape='none')
    
    # RosterData entity
    er.node('RosterData', '''<
<TABLE BORDER="0" CELLBORDER="1" CELLSPACING="0">
<TR><TD BGCOLOR="navy"><FONT COLOR="white"><B>RosterData</B></FONT></TD></TR>
<TR><TD ALIGN="LEFT">tenant_id (FK)</TD></TR>
<TR><TD ALIGN="LEFT">headers[]</TD></TR>
<TR><TD ALIGN="LEFT">teams{}</TD></TR>
</TABLE>>''', shape='none')
    
    # Relationships
    er.edge('Tenant', 'Admin', label='1:N', fontsize='10')
    er.edge('Tenant', 'Employee', label='1:N', fontsize='10')
    er.edge('Tenant', 'RosterData', label='1:1', fontsize='10')
    er.edge('Employee', 'ScheduleRequest', label='1:N', fontsize='10')
    er.edge('RosterData', 'Employee', label='contains', style='dashed', fontsize='10')
    
    output_path = '/home/runner/work/rster/rster/Documentation/diagrams/ER_Diagram'
    er.render(output_path, cleanup=True)
    print(f"✓ ER Diagram saved to {output_path}.png")

if __name__ == "__main__":
    print("Generating RosterBhai Diagrams...\n")
    
    # Create output directories
    import os
    base_path = '/home/runner/work/rster/rster/Documentation'
    os.makedirs(f'{base_path}/diagrams', exist_ok=True)
    os.makedirs(f'{base_path}/diagrams_pptx', exist_ok=True)
    os.makedirs(f'{base_path}/diagrams_editable', exist_ok=True)
    
    print("📊 Generating diagrams for documentation...")
    create_use_case_diagram()
    create_context_dfd()
    create_level1_dfd()
    create_architecture_diagram()
    create_er_diagram()
    
    print("\n✓ All diagrams generated successfully!")
    print("\nDiagram files location:")
    print(f"  Documentation: {base_path}/diagrams/")
    print(f"  PowerPoint:    {base_path}/diagrams_pptx/ (copies)")
    print(f"  Editable:      {base_path}/diagrams_editable/ (SVG format)")
