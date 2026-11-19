# **Administrator User Views of MCIIS Repository**

## **Data Requirements:**

**User**

Administrators manage user accounts, assign roles, and generate reports on user role distribution. Student information is preloaded (seeded) into the system, and Gmail-based invitations are no longer used; accounts are added directly by Administrators. The User entity includes attributes *userID* (unique identifier), *studentID* (nullable for non-student roles), *firstName*, *middleName*, *lastName*, *contactNumber*, *email* (valid USeP email and must be unique), *password*, and *createdTimestamp*. The User entity has no direct role column; roles are represented through the user-role relationship.

**Role and User Role**

Administrators assign roles through the user-role relationship. The Role entity includes *roleID* (unique identifier) and *roleName* (“Administrator,” “MCIIS Staff,” “Faculty,” “Student,” or “Librarian”). The User Role relationship (a join table) links a user to a role and includes *userID* (foreign key referencing the User entity) and *roleID* (foreign key referencing the Role entity).

**Research**

Administrators can view research information and generate reports on research access statistics and keyword usage. The Research entity includes *researchID* (unique identifier), *uploadedBy* (referencing the User entity), *researchTitle* (must be unique), *researchAdviser* (referencing the Faculty entity), *program* (“Bachelor of Science in Information Technology,” “Bachelor of Science in Computer Science,” “Bachelor of Library and Information Science,” “Master of Library and Information Science,” or “Master in Information Technology”), *completionMonth* (the month the research was completed), *completionYear* (the year the research was completed), *completionDate* (the combined display value derived from *completionMonth* and *completionYear*; not entered separately), *researchAbstract* (text; an Abstract for BLIS and BSCS programs, an Executive Summary for all other programs), *researchManuscript* (pdf file, approximately 20 pages following the IMRAD format; the Approval Sheet is no longer uploaded; the manuscript is viewed only through the research preview), *doiLink* (string, optional; links to the research when applicable), *physicalAttributes* (JSON; stores the physical library details of the hardbound copy: *hardboundLocation*, the exact shelf, room, or section in the physical CIC library where the copy is kept, and *physicalAvailability*, a boolean (only true or false) indicating whether the hardbound copy is available in the physical library), and *status* (“draft,” “posted,” or “archived,” tracking the entry’s progress from encoding by Faculty or designated MCIIS Staff, through finalization of the Dublin Core metadata by a Librarian, to posting). The status value is stored as draft, posted, or archived. A draft entry is still being encoded; a posted entry (described to users as completed research) has had its required metadata finalized by a Librarian and is viewable according to the visibility rules; and an archived entry is no longer accessible to students or other faculties. A research entry becomes posted only after the Librarian has completed the metadata encoding and review. They can also filter it by researchAdviser, program, completion year, and status. Administrators can view research entries in any status, while other roles outside the entry’s adviser may only view entries with a “posted” status. Manuscript access is restricted to the research preview, which may be watermarked and may exclude restricted sections such as the Review of Related Literature (RRL) where institutional policy requires. No user role may download the unrestricted full manuscript unless this is explicitly authorized by a separate institutional policy.

Dublin Core metadata: Administrators can view the Librarian-curated Dublin Core metadata of research entries in any status, which is stored as repeatable Research Metadata Value records (defined in the Librarian views). Creating and maintaining these records is the responsibility of Librarians.

**Faculty**

Administrators can add, edit, and delete the faculty list. The Faculty entity includes *facultyID* (unique identifier), *firstName*, *middleName*, *lastName*, *position*, *designation*, *email* (valid USeP email and must be unique), *ORCID*, *contactNumber*, *educationalAttainment*, *fieldOfSpecialization*, and *researchInterest*.

**Researcher**

Administrators can view researcher information. The Researcher entity includes *researcherID*, *researchID* (referencing the Research entity), *firstName*, *middleName*, *lastName*, and *email* (valid USeP email and must be unique).

**Keyword**

Administrators can view keywords. The Keyword entity includes *keywordID* (unique identifier) and *keywordName* (unique).

**Panel**

Administrators can view the list of faculty panelists to research projects. A faculty member can be a panelist for multiple research projects, while a research project can have multiple panelists. The Panel entity is a join table that handles the many-to-many relationship between faculty members and research entries that includes *panelID* (a unique identifier), *facultyID* (foreign key referencing the Faculty entity), and *researchID* (foreign key referencing the Research entity).

**User Audit Log**

Administrators are responsible for maintaining logs of profile-related activities to ensure accountability and security. The User Audit Log entity tracks any changes made to user or faculty profiles. It records details such as *auditLogID* (a unique identifier), *modifiedBy* (referencing the User entity, representing the administrator, faculty, or student who made the change), *targetUserID* (referencing the User entity if a user profile was modified), *actionType* (e.g., "update user"), and *timestamp* (the date and time the change occurred).

**Faculty Audit Log**

Administrators are responsible for maintaining logs of profile-related activities to ensure accountability and security. The Faculty Audit Log entity tracks any changes made to user or faculty profiles. It records details such as *auditLogID* (a unique identifier), *modifiedBy* (referencing the User entity, representing the administrator or faculty who made the change), *targetFacultyID* (referencing the Faculty entity if a faculty profile was modified), *actionType* (e.g., "update faculty"), and *timestamp* (the date and time the change occurred).

**Research Access Log**

Administrators can generate reports on the most research accessed entries. An access is counted when a user selects (clicks) a research entry from the search results or from the browse page. The Research Access Log entity includes *accessLogID*, *researchID* (referencing the Research entity), *userID* (referencing the User entity; nullable for guests), and *accessTimestamp*. Guest access events are included in the access count.

**Access Statistics**

Administrators can view aggregated views and accesses per research entry, categorized by program and by guest users, to support access reporting.

**Keyword Search Log**

Administrators use keyword search log to generate reports on the most frequently searched keyword. The Keyword Search Log entity includes *searchLogID*, *keywordID* (referencing the Keyword entity), *userID* (referencing the User entity), and *searchTimestamp*.

**Research Entry Log**

Administrators can view research entry logs to monitor repository activity and trace actions made on research entries. It tracks all actions related to research entries, including direct modifications to research attributes and any changes to associated entities (keywords, researchers, panelists, SDG, SRIG, Agenda, and Dublin Core metadata). The Research Entry Log entity includes *entryLogID* (a unique identifier), *performedBy* (referencing the User entity), *actionType* (a general action such as create or modify), *researchID* (referencing the Research entity), *oldValues* and *newValues* (JSON; the field-level changes made, kept in the log entry’s change data rather than in the actionType), and *timestamp* (indicating the date and time of the action).

**Compiled Report**

Administrators can generate and download compiled reports to consolidate abstracts, executive summaries, and matrix or tabular reports based on various filters such as program, completion year, adviser, and status. The Compiled Report entity is designed to keep a record of these generated outputs for documentation and reference. It includes the following attributes: *reportID* (a unique identifier), *reportType* (the type of report, e.g., Abstracts, Executive Summaries, Statistics, or Matrix), *generatedBy* (foreign key referencing the User entity that indicates who generated the report), *generatedOn* (the date and time the report was created), *filtersApplied* (a JSON field containing the applied filters such as program, completion year, adviser, and status), and *filePath* (the storage location of the generated Word or PDF file that supports OCR for searchability).

**Program, Agenda, SDG, and SRIG**

Administrators can directly manage and add the list of programs, SRIGs, SDGs, and College Research Agendas. These lists are used as dropdown options for research metadata. The Agenda, SDG, and SRIG entities are defined in the MCIIS Staff views below.

## **Transaction Requirements:**

**Data Entry**

●       Add the details of a new user account, assigning an initial user role (Administrator, MCIIS Staff, Faculty, Student, or Librarian).

●       Preload (seed) student information into the system.

●       Add and manage programs, SRIGs, SDGs, and College Research Agendas.

●       Add new faculty records with a complete profile.

**Data Update/Deletion**

●       Update/delete the details of a user account.

●       Update/delete programs, SRIGs, SDGs, and College Research Agendas.

●       Update/delete faculty profiles.

**Data Queries**

●       Search research by title or keyword.

●       Filter research by adviser, program, completion year, and status.

●       View profile information of faculty members.

●       View the research card, metadata, and research preview of a research entry (subject to policy).

●       Generate reports on user role distribution (number of Administrators, MCIIS Staff, Faculty, Student, and Librarian).

●       Generate and download a faculty information report (PDF/Excel) compiling faculty profile details such as name, position, designation, contact information, ORCID, educational attainment, field of specialization, and research interest.

●       Generate and download compilations of abstracts or executive summaries by Program, Completion Year, and Faculty/Adviser, which include the research title, list of researchers, research adviser, month and year of completion, the abstract or executive summary, and associated keywords.

●       Generate and download reports in matrix or tabular format (PDF/Excel) that include the following fields: Research Title, Status, Date Completed (Month and Year), Researchers, Research Adviser, Keywords, Panel, Related Agenda, Related SDG, and Related SRIG, filterable by status.

●       Identify the top 5 most accessed research entries based on access count.

●       Identify the top 5 most frequently used keywords.

●       View research output counts per program (report title revised from “Most Productive Program” to “Research Output per Program,” based on research output counts).

●       View research counts per completion year.

●       Generate customizable reports in which Administrators and program heads dynamically select the applicable fields and filters (for example, a report on the most searched keywords) rather than relying solely on fixed fields.

●       Generate SDG attainment reports with completion-year filters and visual representations (e.g., charts) of the percentage of papers contributing to each SDG.

# 

# **MCIIS Staff User Views of MCIIS Repository**

## **Data Requirements:**

**Research**

MCIIS Staff are responsible for adding and editing research metadata, ensuring all research entries are accurate, complete, and properly categorized. The Research entity includes *researchID* (unique identifier), *uploadedBy* (referencing the User entity), *researchTitle* (must be unique), *researchAdviser* (referencing the Faculty entity), *program* (“Bachelor of Science in Information Technology,” “Bachelor of Science in Computer Science,” “Bachelor of Library and Information Science,” “Master of Library and Information Science,” or “Master in Information Technology”), *completionMonth* (the month the research was completed), *completionYear* (the year the research was completed), *completionDate* (the combined display value derived from *completionMonth* and *completionYear*; not entered separately), *researchAbstract* (text; an Abstract for BLIS and BSCS programs, an Executive Summary for all other programs), *researchManuscript* (pdf file, approximately 20 pages following the IMRAD format; the Approval Sheet is no longer uploaded; the manuscript is viewed only through the research preview), *doiLink* (string, optional; links to the research when applicable), *physicalAttributes* (JSON; stores the physical library details of the hardbound copy: *hardboundLocation*, the exact shelf, room, or section in the physical CIC library where the copy is kept, and *physicalAvailability*, a boolean (only true or false) indicating whether the hardbound copy is available in the physical library), and *status* (“draft,” “posted,” or “archived,” tracking the entry’s progress from encoding by Faculty or designated MCIIS Staff, through finalization of the Dublin Core metadata by a Librarian, to posting). They can also filter it by researchAdviser, program, and completion year. MCIIS Staff can view research entries in any status.

Upload and metadata standards: Research entry uploads are restricted to designated MCIIS Staff members (Faculty members follow the exact same upload process). Uploaded manuscripts are limited to approximately 20 pages following the IMRAD format, and only the manuscript file is retained (the Approval Sheet is removed). The abstract requirement is an Abstract for BLIS and BSCS programs and an Executive Summary for other applicable programs. Metadata fields use dropdown selections instead of manual text input whenever possible. Staff encode the information available to them as a draft; the entry becomes posted only after the Librarian has finalized the required Dublin Core metadata.

Dublin Core metadata: MCIIS Staff can view the Librarian-curated Dublin Core metadata and the research preview of any research entry (subject to policy). Adding, editing, and finalizing Dublin Core metadata is done by Librarians; existing research fields are not used to populate it automatically. The uploader (*uploadedBy*) is not treated as the Dublin Core creator.

Thematic tagging: Each research entry can be associated with one or more Agenda, SDG, and SRIG categories to enable classification, reporting, and dashboard analytics.

**Faculty**

MCIIS Staff can view the faculty list. The Faculty entity includes *facultyID* (unique identifier), *firstName*, *middleName*, *lastName*, *position*, *designation*, *email* (valid USeP email and must be unique), *ORCID*, *contactNumber*, *educationalAttainment*, *fieldOfSpecialization*, and *researchInterest*. They can also assign research to faculties who are research advisers and panelists, as well as generate productivity reports identifying the number of research entries advised and paneled per faculty member. Advised and paneled counts include research entries in any status (draft, posted, archived), since the adviser/panelist assignment — not the entry's posting state — is what constitutes advising or paneling workload.

**Researcher**

MCIIS Staff can add, edit, and delete researcher information and ensure that each research entry has properly recorded contributors. The Researcher entity includes *researcherID*, *researchID* (referencing the Research entity), *firstName*, *middleName*, *lastName*, and *email* (valid USeP email and must be unique).

**Keyword**

MCIIS Staff can add in the keyword list. The keyword entity includes *keywordID* (a unique identifier) and *keywordName* (must also be unique), representing the topic associated with a research entry. They can also link and unlink keywords with research entries.

**Panel**

MCIIS Staff can add, edit, and delete the list of faculty panelists to research projects. A faculty member can be a panelist for multiple research projects, while a research project can have multiple panelists. The Panel entity is a join table that handles the many-to-many relationship between faculty members and research entries that includes *panelID* (a unique identifier), *facultyID* (foreign key referencing the Faculty entity), and *researchID* (foreign key referencing the Research entity).

**Research Entry Log**

MCIIS Staff creation, modification, and archiving of a research entry is tracked through the research entry log. It tracks all actions related to research entries, including direct modifications to research attributes and any changes to associated entities (keywords, researchers, panelists, SDG, SRIG, Agenda, and Dublin Core metadata). The Research Entry Log entity includes *entryLogID* (a unique identifier), *performedBy* (referencing the User entity), *actionType* (a general action such as create or modify), *researchID* (referencing the Research entity), *oldValues* and *newValues* (JSON; the field-level changes made, kept in the log entry’s change data rather than in the actionType), and *timestamp* (indicating the date and time of the action).

**Agenda**

MCIIS Staff can categorize and align research outputs with institutional or college research priorities to support thematic analysis and strategic reporting. The Agenda entity provides a structured way to classify research according to established research agendas. It includes the following attributes: *agendaID* (a unique identifier), *agendaName* (the name of the research agenda, e.g., “University Research Agenda”), and *agendaDescription* (a text field that provides details on the scope, objectives, or description of the agenda).

**SDG**

MCIIS Staff can align research projects with the United Nations Sustainable Development Goals (SDGs) to support institutional reporting and global agenda alignment. The SDG entity represents these goals and their related descriptions. It includes the following attributes: *sdgID* (a unique identifier), *sdgName* (the name of the SDG, e.g., “SDG4 – Quality Education”), and *sdgDescription* (a text field containing the official UN or localized context of the SDG).

**SRIG**

MCIIS Staff can categorize research outputs under thematic clusters to better organize and analyze research trends within the institution. The SRIG (Strategic Research Interest Group) entity defines specific research clusters or focus areas. It includes the following attributes: *srigID* (a unique identifier), *srigName* (the name of the research interest group, e.g., “Artificial Intelligence & Machine Learning”), and *srigDescription* (a text field explaining the research themes and topics that fall under this SRIG).

## **Transaction Requirements:**

**Data Entry**

●       Add a new research entry with complete details (manuscript of approximately 20 pages in IMRAD format, without Approval Sheet), using dropdown selections for metadata fields wherever possible.

●       Add a new researcher and associate them with a research entry.

●       Add a new keyword to the Keyword table (if it does not already exist, if it exists, simply add a record in the ResearchKeyword join table).

●       Add a record in the ResearchKeyword join table to associate a keyword to a research entry.

●       Add a record in the Panelist join table to associate a faculty to a research entry.

●       Add a record in the ResearchAgenda, ResearchSRIG, and ResearchSDG join table to associate a research under Agenda, SDG, or SRIG.

**Data Update/Deletion**

●       Update the details of an existing research entry, including archiving it.

●       Update the information of a researcher.

●       Update the associated Agenda, SDG, or SRIG of a research.

●       Update a record in the ResearchAgenda, ResearchSRIG, and ResearchSDG join table to associate a research under Agenda, SDG, or SRIG.

●       Delete a researcher associated with a research.

●       Delete a record in the ResearchKeyword join table to unlink a keyword from a research entry.

●       Delete a record in the Panelist join table to unlink a faculty from a research entry.

●       Delete the associated Agenda, SDG, or SRIG of a research.

**Data Queries**

●       Search research by title or keyword.

●       Filter research by adviser, program, or completion year.

●       View profile information of faculty members.

●       Generate a faculty productivity report identifying the number of research entries advised and paneled per faculty member, counted for all statuses except archived and filterable by school year.

●       Generate a report showing the number and percentage of research per program are associated with Agenda, SRIG, and SDG.

●       Generate a report showing the number and percentage of research per completion year within the program are associated with Agenda, SRIG, and SDG.

●       Identify the top 5 research advisers who have the most number of advised research projects.

●       Identify the top 5 research panelists who have the most number of paneled research projects.

●       View the full information of a research including researchID, researchTitle, program, completionMonth, completionYear, completionDate, researchAbstract, researchAdviser, researchers, panelists, keywords, doiLink, physicalAttributes (hardboundLocation and physicalAvailability), the Librarian-curated Dublin Core metadata, and the research preview of the manuscript (subject to policy; no unrestricted full download).

# **Faculty User Views of MCIIS Repository**

## **Data Requirements:**

**Research**

Faculty members can add and edit research entries they advise on, ensuring that all research metadata is accurate and properly documented. Research entries are encoded by the faculty adviser or designated MCIIS Staff; students do not create, edit, or submit research entries. The faculty member creates the entry (status “draft”) and provides the information available to them. The Librarian then provides and finalizes the required Dublin Core metadata, and only after the Librarian has completed the metadata encoding and review does the entry become “posted” (completed research) and viewable according to the visibility rules. Status can also be set to “archived” and the research becomes inaccessible by students or other faculties. The Research entity includes *researchID* (unique identifier), *uploadedBy* (referencing the User entity), *researchTitle* (must be unique), *researchAdviser* (referencing the Faculty entity), *program* (“Bachelor of Science in Information Technology,” “Bachelor of Science in Computer Science,” “Bachelor of Library and Information Science,” “Master of Library and Information Science,” or “Master in Information Technology”), *completionMonth* (the month the research was completed), *completionYear* (the year the research was completed), *completionDate* (the combined display value derived from *completionMonth* and *completionYear*; not entered separately), *researchAbstract* (text; an Abstract for BLIS and BSCS programs, an Executive Summary for all other programs), *researchManuscript* (pdf file, approximately 20 pages following the IMRAD format; the Approval Sheet is no longer uploaded; the manuscript is viewed only through the research preview), *doiLink* (string, optional; links to the research when applicable), *physicalAttributes* (JSON; stores the physical library details of the hardbound copy: *hardboundLocation*, the exact shelf, room, or section in the physical CIC library where the copy is kept, and *physicalAvailability*, a boolean (only true or false) indicating whether the hardbound copy is available in the physical library), and *status* (“draft,” “posted,” or “archived”). They can also filter it by researchAdviser, program, and completion year.

Upload and metadata standards: Faculty members follow the same upload process as designated MCIIS Staff (approximately 20-page IMRAD manuscript, no Approval Sheet, Abstract for BLIS/BSCS or Executive Summary for other programs, and dropdown selections for metadata fields wherever possible).

Dublin Core metadata: Faculty members can view the Librarian-curated Dublin Core metadata and the research preview of the research entries they advised (subject to policy). Adding, editing, and finalizing Dublin Core metadata is done by Librarians.

Thematic tagging: The research entry they advised can be associated with one or more Agenda, SDG, and SRIG categories to enable classification, reporting, and dashboard analytics.

**Faculty**

Faculty members can view the faculty list and edit their own faculty information. The Faculty entity includes *facultyID* (unique identifier), *firstName*, *middleName*, *lastName*, *position*, *designation*, *email* (valid USeP email and must be unique), *ORCID*, *contactNumber*, *educationalAttainment*, *fieldOfSpecialization*, and *researchInterest*.

**Researcher**

Faculty members can add researcher information and assign them to the research they participated in. The Researcher entity includes *researcherID*, *researchID* (referencing the Research entity), *firstName*, *middleName*, *lastName*, and *email* (valid USeP email and must be unique).

**Keyword**

Faculty members can create new keyword records if they do not exist and associate them with research entries but cannot modify or delete keywords. The keyword entity includes *keywordID* (a unique identifier) and *keywordName* (must also be unique).

**Panel**

Faculty members can view the list of faculty panelists to research projects. A faculty member can be a panelist for multiple research projects, while a research project can have multiple panelists. The Panel entity is a join table that handles the many-to-many relationship between faculty members and research entries that includes *panelID* (a unique identifier), *facultyID* (foreign key referencing the Faculty entity), and *researchID* (foreign key referencing the Research entity).

**Research Entry Log**

Faculty’s creation, modification, and archiving of a research entry they advised is tracked through the research entry log. It tracks all actions related to research entries, including direct modifications to research attributes and any changes to associated entities (keywords, researchers, panelists, SDG, SRIG, Agenda, and Dublin Core metadata). The Research Entry Log entity includes *entryLogID* (a unique identifier), *performedBy* (referencing the User entity), *actionType* (a general action such as create or modify), *researchID* (referencing the Research entity), *oldValues* and *newValues* (JSON; the field-level changes made, kept in the log entry’s change data rather than in the actionType), and *timestamp* (indicating the date and time of the action).

**Agenda**

Faculty can categorize and align the research entry they advised with institutional or college research priorities to support thematic analysis and strategic reporting. The Agenda entity provides a structured way to classify research according to established research agendas. It includes the following attributes: *agendaID* (a unique identifier), *agendaName* (the name of the research agenda, e.g., “University Research Agenda”), and *agendaDescription* (a text field that provides details on the scope, objectives, or description of the agenda).

**SDG**

Faculty can align the research entry they advised with the United Nations Sustainable Development Goals (SDGs) to support institutional reporting and global agenda alignment. The SDG entity represents these goals and their related descriptions. It includes the following attributes: *sdgID* (a unique identifier), *sdgName* (the name of the SDG, e.g., “SDG4 – Quality Education”), and *sdgDescription* (a text field containing the official UN or localized context of the SDG).

**SRIG**

Faculty can categorize the research entry they advised under thematic clusters to better organize and analyze research trends within the institution. The SRIG (Strategic Research Interest Group) entity defines specific research clusters or focus areas. It includes the following attributes: *srigID* (a unique identifier), *srigName* (the name of the research interest group, e.g., “Artificial Intelligence & Machine Learning”), and *srigDescription* (a text field explaining the research themes and topics that fall under this SRIG).

## **Transaction Requirements:**

**Data Entry**

●       Add a new research entry with complete details (manuscript of approximately 20 pages in IMRAD format, without Approval Sheet), using dropdown selections for metadata fields wherever possible.

●       Add a new researcher and associate them with a research entry.

●       Add a new keyword to the Keyword table (if it does not already exist, if it exists, simply add a record in the ResearchKeyword join table).

●       Add a record in the ResearchKeyword join table to associate a keyword to a research entry.

●       Add a record in the Panelist join table to associate a faculty to a research entry.

●       Add a record in the ResearchAgenda, ResearchSRIG, and ResearchSDG join table to associate a research under Agenda, SDG, or SRIG.

**Data Update/Deletion**

●       Update the details of their own faculty information.

●       Update the details of a research entry they advised.

●       Update the information of a researcher of the research they advised.

●       Update a record in the ResearchAgenda, ResearchSRIG, and ResearchSDG join table to associate a research under Agenda, SDG, or SRIG.

●       Delete a researcher of the research they advised.

●       Delete a record in the ResearchKeyword join table to unlink a keyword from a research entry of the research they advised.

●       Delete a record in the Panelist join table to unlink a faculty from a research entry.

**Data Queries**

●       Search research by title or keyword.

●       Filter research by adviser, program, or completion year.

●       Generate and download a "My Research" list scoped to research entries where they are the adviser or a panelist, filterable by program and completion year.

●       View profile information of faculty members.

●       Generate a report showing the number of research entries they have advised or paneled.

●       View the full information of a research including researchID, researchTitle, program, completionMonth, completionYear, completionDate, researchAbstract, researchAdviser, researchers, panelists, keywords, doiLink, physicalAttributes (hardboundLocation and physicalAvailability), the Librarian-curated Dublin Core metadata, and the research preview of the manuscript (subject to policy; no unrestricted full download).

# **Student User Views of MCIIS Repository**

## **Data Requirements:**

**Research**

Students can search research records, view research cards and allowed metadata, and view a research preview of the manuscript for completed (posted) research entries. Students cannot download the full manuscript, view restricted manuscript sections, create, edit, submit, or manage research records, or request expanded access. The research preview may be watermarked and may exclude restricted sections such as the Review of Related Literature (RRL), if required by institutional policy. Research entries are encoded and maintained only by designated MCIIS Staff or the research adviser (Faculty), and students can only view entries with a “posted” status. The Research entity includes *researchID* (unique identifier), *uploadedBy* (referencing the User entity), *researchTitle* (must be unique), *researchAdviser* (referencing the Faculty entity), *program* (“Bachelor of Science in Information Technology,” “Bachelor of Science in Computer Science,” “Bachelor of Library and Information Science,” “Master of Library and Information Science,” or “Master in Information Technology”), *completionMonth* (the month the research was completed), *completionYear* (the year the research was completed), *completionDate* (the combined display value derived from *completionMonth* and *completionYear*; not entered separately), *researchAbstract* (text; an Abstract for BLIS and BSCS programs, an Executive Summary for all other programs), *researchManuscript* (pdf file, approximately 20 pages following the IMRAD format; the Approval Sheet is no longer uploaded; the manuscript is viewed only through the research preview), *doiLink* (string, optional; links to the research when applicable), *physicalAttributes* (JSON; stores the physical library details of the hardbound copy: *hardboundLocation*, the exact shelf, room, or section in the physical CIC library where the copy is kept, and *physicalAvailability*, a boolean (only true or false) indicating whether the hardbound copy is available in the physical library), and *status* (“posted”; only posted (completed) research is visible to students). They can also filter it by researchAdviser, researchPanel, researcher, completionDate, program, and keyword.

Dublin Core metadata: Students can view the allowed Librarian-curated Dublin Core metadata (for example title, creator, subject, description, date, language, and rights) on the details page of completed (posted) research entries. Students cannot add or edit it.

**User (Student Account)**

Student information is preloaded (seeded) into the system. Students cannot edit their studentID but may update their own contact information (e.g., contactNumber).

**Faculty**

Students can view information about faculty members. The Faculty entity includes *facultyID* (unique identifier), *firstName*, *middleName*, *lastName*, *position*, *designation*, *email* (valid USeP email and must be unique), *ORCID*, *contactNumber*, *educationalAttainment*, *fieldOfSpecialization*, and *researchInterest*.

**Researcher**

Students can view the list of researchers. The Researcher entity includes *researcherID*, *researchID* (referencing the Research entity), *firstName*, *middleName*, *lastName*, and *email* (valid USeP email and must be unique).

**Keyword**

Students can search research using keywords. The keyword entity includes *keywordID* (a unique identifier) and *keywordName* (must also be unique).

**Panel**

Students can view the list of faculty panelists to research projects. A faculty member can be a panelist for multiple research projects, while a research project can have multiple panelists. The Panel entity is a join table that handles the many-to-many relationship between faculty members and research entries that includes *panelID* (a unique identifier), *facultyID* (foreign key referencing the Faculty entity), and *researchID* (foreign key referencing the Research entity).

**Agenda**

Students can view the institutional or college research priorities (Agenda) that completed (posted) research entries are aligned with; students cannot tag or modify them. The Agenda entity provides a structured way to classify research according to established research agendas. It includes the following attributes: *agendaID* (a unique identifier), *agendaName* (the name of the research agenda, e.g., “University Research Agenda”), and *agendaDescription* (a text field that provides details on the scope, objectives, or description of the agenda).

**SDG**

Students can view the United Nations Sustainable Development Goals (SDGs) that completed (posted) research entries are aligned with; students cannot tag or modify them. The SDG entity represents these goals and their related descriptions. It includes the following attributes: *sdgID* (a unique identifier), *sdgName* (the name of the SDG, e.g., “SDG4 – Quality Education”), and *sdgDescription* (a text field containing the official UN or localized context of the SDG).

**SRIG**

Students can view the thematic clusters under which completed (posted) research entries are categorized; students cannot tag or modify them. The SRIG (Strategic Research Interest Group) entity defines specific research clusters or focus areas. It includes the following attributes: *srigID* (a unique identifier), *srigName* (the name of the research interest group, e.g., “Artificial Intelligence & Machine Learning”), and *srigDescription* (a text field explaining the research themes and topics that fall under this SRIG).

## **Transaction Requirements:**

**Data Update/Deletion**

●       Update their own contact information (studentID cannot be edited).

**Data Queries**

●       Search research by title or keyword.

●       Filter research by adviser, program, or completion year.

●       View profile information of faculty members.

●       View the research card and allowed metadata of a completed (posted) research entry, including researchID, researchTitle, program, completionMonth, completionYear, completionDate, researchAbstract, researchAdviser, researchers, panelists, keywords, doiLink, physicalAttributes (hardboundLocation and physicalAvailability), and the allowed Librarian-curated Dublin Core metadata.

●       View the research preview of a completed (posted) research entry’s manuscript (watermarked and without restricted sections where required by policy); full download is not permitted.

# **Guest User Views of MCIIS Repository**

## **Data Requirements:**

**Research**

Guests may view only the research card containing approved or publicly viewable (allowed) metadata of posted (completed) research. Guests may not view the manuscript research preview while unauthenticated, and guests must not have full manuscript download access. To view the research preview, a guest must log in or register for an account and is then treated as an authenticated user who follows the same preview restrictions applied to students.

**Guest Account Role Assignment**

When a guest logs in, the role is assigned as follows: if the email is already associated with a faculty record (faculty\_id), the Faculty role is assigned; if the email does not exist in the database, a Student role is created or assigned. The authenticated account may then view the manuscript research preview subject to the same restrictions as students. Guests still cannot download the unrestricted manuscript.

**Access Statistics**

Guest access events (with a nullable userID) are recorded in the Research Access Log and included in the access count and in the Access Statistics maintained for Administrators, categorized by program and by guest users. An access occurs when the guest selects (clicks) a research entry from the search results or from the browse page.

## **Transaction Requirements:**

**Data Queries**

●       Search research by title or keyword.

●       View the research card with allowed metadata of a posted (completed) research entry.

●       Log in or register for an account (Faculty role if the email matches a faculty record, otherwise Student role) to view the research preview under the same restrictions as students.

# **Librarian User Views of MCIIS Repository**

## **Data Requirements:**

**Research & Physical Library**

Librarians manage library-related information and track the physical location of hardbound manuscripts. To keep the number of columns small, the physical library details are stored together in one JSON attribute of the Research entity, *physicalAttributes*, which contains *hardboundLocation* (text indicating the exact shelf, room, or section in the physical CIC library) and *physicalAvailability* (boolean; only true or false, indicating availability in the physical library). The Research entity otherwise includes *researchID* (unique identifier), *researchTitle*, *researchAdviser* (referencing the Faculty entity), *program*, *completionMonth*, *completionYear*, *completionDate* (derived from *completionMonth* and *completionYear*), *researchAbstract* (text), *doiLink* (string, optional), and *status* (“draft,” “posted,” or “archived”). Librarians provide and finalize the required Dublin Core metadata for research entries created by Faculty or MCIIS Staff. Finalizing the metadata encoding and review is what moves an entry from draft to posted. Librarians can view research entries and the research preview (subject to policy) but cannot archive or delete research entries or manage user accounts.

**Research Metadata Value (Librarian-curated Dublin Core metadata)**

Librarians create, edit, finalize, and maintain the Dublin Core metadata of research entries manually through a dedicated metadata or MARC-style screen. Because Dublin Core elements are optional and repeatable (for example, multiple creators or subjects), the metadata is stored as separate Research Metadata Value records instead of additional columns on the Research entity. The Research Metadata Value entity includes *metadataID* (unique identifier), *researchID* (referencing the Research entity), *term* (the Dublin Core element: title, creator, subject, description, publisher, contributor, date, type, format, identifier, source, language, relation, coverage, or rights, selected from a dropdown), *value* (text), *scheme* (optional encoding scheme, e.g., URI or W3CDTF/ISO 8601 for dates), *sortOrder* (the order of repeated values of the same term), *createdBy* and *updatedBy* (referencing the User entity), *createdTimestamp*, and *updatedTimestamp*. A research entry can have many Research Metadata Value records, including several records with the same term.

The Dublin Core values are entered manually by the Librarian and are not required to be derived automatically from existing Research columns. The Dublin Core language element is a normal repeatable metadata record (term “language”) and has no separate language attribute. Validation takes place during the Librarian’s encoding and finalization of the metadata, so the record has no separate validation status or validator fields; the posted status of the research entry indicates that the required metadata has been finalized. Existing research fields are displayed on the metadata screen as reference information only. If a standardized format is required, the manually entered Dublin Core date is stored in W3CDTF/ISO 8601 format.

| Dublin Core element | Entered manually by the Librarian (examples) | Reference information displayed (not auto-populated) |
| :---- | :---- | :---- |
| title | Title of the work | *researchTitle* |
| creator | Main author(s) or creator(s) | Researcher records (not *uploadedBy*) |
| subject | Topics and subject terms | Keyword; Agenda, SDG, and SRIG |
| description | Summary or abstract | *researchAbstract* |
| publisher | Organization responsible for making the resource available (e.g., MCIIS or USeP) | — |
| contributor | Other contributors | *researchAdviser* and Panel |
| date | Completion date (month and year), W3CDTF/ISO 8601 if standardized | *completionDate* (derived from *completionMonth* and *completionYear*) |
| type | Kind of resource (e.g., Thesis, Research Paper, Technical Report) | *program* |
| format | File or media format (e.g., PDF) | *researchManuscript* |
| identifier | Unique identifier or URL | *researchID* and *doiLink* |
| source | Original source or collection (e.g., MCIIS Institutional Repository) | — |
| language | Language of the resource (e.g., English, Filipino) | — |
| relation | Related thesis, project, or dataset | — |
| coverage | Geographic or time coverage (e.g., Davao Region, Philippines, 2025\) | — |
| rights | Copyright and access conditions (e.g., public, restricted, license information) | — |

 

**Keyword**

Librarians can manage and assign appropriate keywords to research entries to ensure standardized metadata categorization; keywords may be used as Dublin Core subject values. The Keyword entity includes *keywordID* (a unique identifier) and *keywordName* (must be unique).

## **Transaction Requirements:**

**Data Entry & Update**

●       Add and update the physical library details (physicalAttributes: hardboundLocation and physicalAvailability) for research entries.

●       Manually add and update Dublin Core metadata values (Research Metadata Value records) for research entries, including repeated values and scheme, using dropdown selections wherever possible.

●       Finalize the required Dublin Core metadata after encoding and review, which changes the research entry’s status from draft to posted.

●       Assign, manage, and correct keywords associated with research entries.

●       Changes to Dublin Core metadata and keywords are recorded in the Research Entry Log, with the field-level changes kept in the log entry’s old and new values.

**Data Queries**

●       View and search research entries alongside their physical library details (physicalAttributes) to help library patrons locate hardbound copies and check their availability.

●       View the Dublin Core metadata of a research entry, with existing research fields shown as reference information.

●       View the research preview of a research entry (subject to policy).

●       Export the Dublin Core metadata of research entries (e.g., XML or JSON).

# **Research Visibility and Manuscript Access Rules**

The following rules apply to posted research (shown to users as completed research). Allowed metadata is the set of metadata fields approved for display to the user type, as set by institutional policy. The research preview may be watermarked and may exclude restricted sections such as the Review of Related Literature (RRL), if required by institutional policy.

| User type | Research card | Metadata | Research preview |
| :---- | :---- | :---- | :---- |
| Administrator | Yes | Yes | Yes, subject to policy |
| MCIIS Staff | Yes | Yes | Yes, subject to policy |
| Faculty | Yes | Yes | Yes, subject to policy |
| Librarian | Yes | Manage metadata | Yes, subject to policy |
| Student | Yes | Allowed metadata | Preview only |
| Guest | Yes | Allowed card metadata | Only after login |

 

No user role may download the unrestricted full manuscript unless this is explicitly authorized by a separate institutional policy.

