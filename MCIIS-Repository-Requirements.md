# MCIIS Theses and Capstone Repository

## Advanced Information Management

---

## Administrator User Views of MCIIS Repository

### Data Requirements

#### User

Administrators manage user accounts, assign roles, and generate reports on user role distribution.

**User Entity Attributes:**

- `userID` - unique identifier
- `studentID` - nullable for non-student roles
- `firstName`, `middleName`, `lastName`
- `contactNumber`
- `email` - valid USeP email, must be unique
- `role` - "Administrator," "MCIIS Staff," "Faculty," or "Student"
- `password`
- `createdTimestamp`

#### Research

Administrators can view research information and generate reports on research access statistics and keyword usage.

**Research Entity Attributes:**

- `researchID` - unique identifier
- `uploadedBy` - references User entity
- `researchTitle` - must be unique
- `researchAdviser` - references Faculty entity
- `program` - "Bachelor of Science in Information Technology," "Bachelor of Science in Computer Science," "Bachelor of Library and Information Science," "Master of Library and Information Science," or "Master in Information Technology"
- `publishedMonth`, `publishedYear`
- `researchAbstract` - text
- `researchApprovalSheet` - image
- `researchManuscript` - pdf file

**Filtering Options:** By researchAdviser, program, and year

#### Faculty

Administrators can add, edit, and delete the faculty list.

**Faculty Entity Attributes:**

- `facultyID` - unique identifier
- `firstName`, `middleName`, `lastName`
- `position`, `designation`
- `email` - valid USeP email, must be unique
- `ORCID`
- `contactNumber`
- `educationalAttainment`
- `fieldOfSpecialization`
- `researchInterest`

#### Researcher

Administrators can view researcher information.

**Researcher Entity Attributes:**

- `researcherID`
- `researchID` - references Research entity
- `firstName`, `middleName`, `lastName`
- `email` - valid USeP email, must be unique

#### Keyword

Administrators can view keywords.

**Keyword Entity Attributes:**

- `keywordID` - unique identifier
- `keywordName` - unique

#### Panel

Administrators can view the list of faculty panelists to research projects. A faculty member can be a panelist for multiple research projects, while a research project can have multiple panelists.

**Panel Entity Attributes (Join Table):**

- `panelID` - unique identifier
- `facultyID` - foreign key referencing Faculty entity
- `researchID` - foreign key referencing Research entity

#### User Audit Log

Administrators are responsible for maintaining logs of profile-related activities to ensure accountability and security.

**User Audit Log Entity Attributes:**

- `auditLogID` - unique identifier
- `modifiedBy` - references User entity (administrator or faculty who made the change)
- `targetUserID` - references User entity if a user profile was modified
- `actionType` - e.g., "update user"
- `timestamp` - date and time the change occurred

#### Faculty Audit Log

Administrators are responsible for maintaining logs of profile-related activities to ensure accountability and security.

**Faculty Audit Log Entity Attributes:**

- `auditLogID` - unique identifier
- `modifiedBy` - references User entity
- `targetFacultyID` - references Faculty entity if a faculty profile was modified
- `actionType` - e.g., "update faculty"
- `timestamp` - date and time the change occurred

#### ResearchAccessLog

Administrators can generate reports on the most research accessed entries.

**ResearchAccessLog Entity Attributes:**

- `accessLogID`
- `researchID` - references Research entity
- `userID` - references User entity
- `accessTimestamp`

#### KeywordSearchLog

Administrators use keyword search log to generate reports on the most frequently searched keyword.

**KeywordSearchLog Entity Attributes:**

- `searchLogID`
- `keywordID` - references Keyword entity
- `userID` - references User entity
- `searchTimestamp`

#### ResearchEntryLog

Administrators can view research entry logs to monitor repository activity and trace actions made on research entries.

**ResearchEntryLog Entity Attributes:**

- `entryLogID` - unique identifier
- `performedBy` - references User entity
- `actionType` - create or modify
- `researchID` - references Research entity
- `timestamp` - date and time of the upload

#### CompiledReport

Administrators can generate and download compiled reports to consolidate abstracts, executive summaries, and matrix or tabular reports.

**CompiledReport Entity Attributes:**

- `reportID` - unique identifier
- `reportType` - "Abstracts," "Executive Summaries," "Statistics," or "Matrix"
- `generatedBy` - foreign key referencing User entity
- `generatedOn` - date and time the report was created
- `filtersApplied` - JSON field containing applied filters (program, year, adviser)
- `filePath` - storage location of the generated Word or PDF file that supports OCR

### Transaction Requirements

#### Data Entry

- Add the details of a new user account, assigning an initial user role (Administrator, MCIIS Staff, Faculty, or Student)
- Add new faculty records with a complete profile

#### Data Update/Deletion

- Update/delete the details of a user account
- Update/delete faculty profiles

#### Data Queries

- Search research by title or keyword
- Filter research by adviser, program, or year
- View profile information of faculty members
- Generate reports on user role distribution (number of Administrators, MCIIS Staff, Faculty, and Student)
- Generate and download compilations of abstracts or executive summaries by Program, Year, and Faculty/Adviser (including research title, list of researchers, research adviser, month and year of publication, abstract or executive summary, and associated keywords)
- Generate and download reports in matrix or tabular format (PDF/Excel) with fields: Research Title, Date Completed, Researchers, Research Adviser, Keywords, Panel, Related Agenda, Related SDG, and Related SRIG
- Identify the top 5 most accessed research entries based on access count
- Identify the top 5 most frequently used keywords
- View research counts per program
- View research counts per year

---

## MCIIS Staff User Views of MCIIS Repository

### Data Requirements

#### Research

MCIIS Staff are responsible for adding and editing research metadata, ensuring all research entries are accurate, complete, and properly categorized. Same attributes as Administrator view.

**Thematic Tagging:** Each research entry can be associated with one or more Agenda, SDG, and SRIG categories to enable classification, reporting, and dashboard analytics.

#### Faculty

MCIIS Staff can view the faculty list. They can also assign research to faculties who are research advisers and panelists, and generate productivity reports identifying the number of research entries advised and paneled per faculty member.

#### Researcher

MCIIS Staff can add, edit, and delete researcher information and ensure that each research entry has properly recorded contributors.

#### Keyword

MCIIS Staff can add keywords to the list. They can also link and unlink keywords with research entries.

#### Panel

MCIIS Staff can add, edit, and delete the list of faculty panelists to research projects.

#### Research Entry Log

MCIIS Staff creation, modification, and archiving of a research entry is tracked through the research entry log. It tracks all actions related to research entries, including direct modifications to research attributes and any changes to associated entities (keywords, researchers, panelists, SDG, SRIG, and Agenda).

#### Agenda

MCIIS Staff can categorize and align research outputs with institutional or college research priorities to support thematic analysis and strategic reporting.

**Agenda Entity Attributes:**

- `agendaID` - unique identifier
- `agendaName` - name of the research agenda, e.g., "University Research Agenda"
- `agendaDescription` - text field providing details on the scope, objectives, or description

#### SDG

MCIIS Staff can align research projects with the United Nations Sustainable Development Goals (SDGs).

**SDG Entity Attributes:**

- `sdgID` - unique identifier
- `sdgName` - name of the SDG, e.g., "SDG4 – Quality Education"
- `sdgDescription` - text field containing the official UN or localized context

#### SRIG

MCIIS Staff can categorize research outputs under thematic clusters.

**SRIG Entity Attributes:**

- `srigID` - unique identifier
- `srigName` - name of the research interest group, e.g., "Artificial Intelligence & Machine Learning"
- `srigDescription` - text field explaining the research themes and topics

### Transaction Requirements

#### Data Entry

- Add a new research entry with complete details
- Add a new researcher and associate them with a research entry
- Add a new keyword to the Keyword table (if it does not already exist; if it exists, simply add a record in the ResearchKeyword join table)
- Add a record in the ResearchKeyword join table to associate a keyword to a research entry
- Add a record in the Panelist join table to associate a faculty to a research entry
- Add a record in the ResearchAgenda, ResearchSRIG, and ResearchSDG join table to associate a research under Agenda, SDG, or SRIG

#### Data Update/Deletion

- Update the details of an existing research entry
- Update the information of a researcher
- Update the associated Agenda, SDG, or SRIG of a research
- Delete a researcher associated with a research
- Delete a record in the ResearchKeyword join table to unlink a keyword from a research entry
- Delete a record in the Panelist join table to unlink a faculty from a research entry
- Delete the associated Agenda, SDG, or SRIG of a research

#### Data Queries

- Search research by title or keyword
- Filter research by adviser, program, or year
- View profile information of faculty members
- Generate a list of all faculty with their advised and paneled research counts
- Generate a report showing the number and percentage of research per program associated with Agenda, SRIG, and SDG
- Generate a report showing the number and percentage of research per year within the program associated with Agenda, SRIG, and SDG
- Identify the top 5 research advisers who have the most number of advised research projects
- Identify the top 5 research panelists who have the most number of paneled research projects
- View the full information of a research including all attributes

---

## Faculty User Views of MCIIS Repository

### Data Requirements

#### Research

Faculty members can add and edit research entries they advise on, ensuring that all research metadata is accurate and properly documented. Same attributes as above.

**Thematic Tagging:** The research entry they advised can be associated with one or more Agenda, SDG, and SRIG categories.

#### Faculty

Faculty members can view the faculty list and edit their own faculty information.

#### Researcher

Faculty members can add researcher information and assign them to the research they participated in.

#### Keyword

Faculty members can create new keyword records if they do not exist and associate them with research entries but cannot modify or delete keywords.

#### Panel

Faculty members can view the list of faculty panelists to research projects.

#### Research Entry Log

Faculty's creation, modification, and archiving of a research entry they advised is tracked through the research entry log.

#### Agenda, SDG, SRIG

Faculty can categorize and align the research entry they advised with these categories.

### Transaction Requirements

#### Data Entry

- Add a new research entry with complete details
- Add a new researcher and associate them with a research entry
- Add a new keyword to the Keyword table or add a record in the ResearchKeyword join table
- Add a record in the ResearchKeyword join table to associate a keyword to a research entry
- Add a record in the Panelist join table to associate a faculty to a research entry
- Add a record in the ResearchAgenda, ResearchSRIG, and ResearchSDG join table

#### Data Update/Deletion

- Update the details of their own faculty information
- Update the details of a research entry they advised
- Update the information of a researcher of the research they advised
- Delete a researcher of the research they advised
- Delete a record in the ResearchKeyword join table to unlink a keyword
- Delete a record in the Panelist join table to unlink a faculty

#### Data Queries

- Search research by title or keyword
- Filter research by adviser, program, or year
- View profile information of faculty members
- Generate a report showing the number of research entries they have advised or paneled
- View the full information of a research

---

## Student User Views of MCIIS Repository

### Data Requirements

#### Research

Students can edit existing research entries where they are the researcher (link through researcher and user email). The research entry must be precreated by the faculty who is the adviser of that research.

**Filtering Options:** By researchAdviser, researchPanel, researcher, publishedDate, program, and keyword

**Thematic Tagging:** The research entry where they are the researcher can be associated with one or more Agenda, SDG, and SRIG categories.

#### Faculty

Students can view information about faculty members.

#### Researcher

Students can view the list of researchers.

#### Keyword

Students can search research using keywords.

#### Panel

Students can view the list of faculty panelists to research projects.

#### Agenda, SDG, SRIG

Students can categorize and align the research entry where they are the researcher with these categories.

### Transaction Requirements

#### Data Entry

- Add a new keyword to the Keyword table or add a record in the ResearchKeyword join table
- Add a record in the ResearchKeyword join table to associate a keyword to a research entry
- Add a record in the Panelist join table to associate a faculty to a research entry
- Add a record in the ResearchAgenda, ResearchSRIG, and ResearchSDG join table

#### Data Update/Deletion

- Update the details of a research entry where they are the researcher
- Update a record in the ResearchAgenda, ResearchSRIG, and ResearchSDG join table
- Delete a record in the ResearchKeyword join table to unlink a keyword
- Delete a record in the Panelist join table to unlink a faculty

#### Data Queries

- Search research by title or keyword
- Filter research by adviser, program, or year
- View profile information of faculty members
- View the full information of a research
