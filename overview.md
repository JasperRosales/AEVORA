## Feature: Overview/Homepage

## 1. Header / Top Navigation

The Header provides the main navigation and account controls of Aevora. It should remain visible while users move between the different sections of the system, allowing them to quickly access the information they need.

## Components:

- Aevora logo and name

- Current page: Overview

- Search

- Notifications

- User profile

- Profile/account menu

- Logout

## 2. Welcome Section

The Welcome Section provides a simple introduction when the administrator enters the Overview page. It can display the user's name and a short system message while keeping the interface clean and professional.

Components:

- “Good morning, [Admin Name]”

- Short system message

- Current date

- Quick access to important functions

## 3. Cemetery Selector

Since Aevora manages multiple cemeteries, the Cemetery Selector allows administrators to choose which cemetery's information they want to view on the dashboard. This prevents information from different cemeteries from being mixed together and allows the dashboard to provide cemetery-specific statistics.

Cemetery options:

- Mt. Zion Memorial Park

- Eternal Garden

- Batangas Floral Garden

- Batangas Public Cemetery

- All Cemeteries

## 4. Cemetery Summary Cards

The Cemetery Summary Cards provide an immediate overview of the current condition of the selected cemetery. These cards should display the most important numbers at the top of the page so administrators can understand the cemetery's status at a glance.

Summary cards:

- Total Plots

- Available

- Reserved

- Occupied

- Waiting for Checking

- Total Clients

The plot statuses follow the MVP's defined map classifications: Available, Reserved, Occupied, and Waiting for Checking.

## 5. Plot Occupancy Overview

The Plot Occupancy Overview provides a visual summary of how cemetery spaces are currently being utilized. Instead of requiring the administrator to open the Cemetery Map, the Overview can provide a simple visualization of available, reserved, and occupied plots.

## Display:

- Available plots

- Reserved plots

- Occupied plots

- Waiting for Checking

- Occupancy percentage

- Total plots

Suggested visualization:

- Donut chart or progress indicator

- Color-coded status legend

## 6. Quick Actions

The Quick Actions section provides shortcuts to frequently used administrative functions. This allows staff to perform common tasks directly from the homepage instead of navigating through multiple menus.

Quick actions:

- Add Client

- Add Plot

- View Cemetery Map

- Create Reservation

- Review Information Checking

- View Agreements

- Record Payment

- Generate Report

## 7. Recent Reservations

The Recent Reservations section displays the latest reservation activities recorded in the system. This allows administrators and staff to immediately see new reservations and their associated clients and plots. The MVP identifies recent reservations as one of the information that should be available through the dashboard and reports.

Displayed information:

- Reservation Number

- Client Name

- Cemetery

- Plot Number

- Date

- Status

- View button

## 8. Information Checking

The Information Checking section highlights reservations or client submissions that still require staff verification. Since the MVP requires clients to upload a valid ID and specifies that administrators/staff manually review the information, this section helps staff identify records that need attention.

Displayed information:

- Client Name

- Reservation/Reference Number

- Submitted Date

- Verification Status

- Review button

Status:

- Waiting for Checking

- Under Review

- Verified

- Requires Action

## 9. Payment Summary

The Payment Summary provides a quick view of payment activity recorded in Aevora. It allows administrators to monitor the overall payment situation and identify transactions that may require attention. The MVP includes payment history, total amount, amount paid, remaining balance, and payment status.

Summary:

- Total Payments

- Amount Collected

- Remaining Balance

- Paid

- Pending

- Overdue

## 10. Agreement Summary

The Agreement Summary provides an overview of agreements generated from reservations. Since the reservation process connects the client, plot, reservation, and agreement, this section gives administrators

a quick way to monitor the status of agreement records.

Displayed information:

- Total Agreements

- Pending

- Active

- Completed

- Recent Agreements

- View All Agreements button

## 11. Recent Activity

The Recent Activity section provides a chronological record of important actions performed within the system. It helps administrators monitor what has recently happened without opening each individual

section.

Possible activities:

- New client registered

- New reservation submitted

- Plot status updated

- Information checked

- Agreement created

- Payment recorded

- Report generated

Displayed information:

- Activity

- User

- Date and time

- Related record

## 12. Reports and Analytics

The Reports and Analytics section provides quick access to important cemetery reports. Rather than showing every report on the homepage, it can highlight key report categories and allow administrators to generate or open detailed reports when needed. The MVP identifies reports for available, reserved, and

The National Engineering University

Golden Country Homes, Alangilan Batangas City, Batangas, Philippines 4200

occupied plots, clients, payment status, recent reservations, agreements, and information-checking results.

## Report shortcuts:

- Plot Occupancy

- Reservations

- Clients

- Payments

- Agreements

- Information Checking

## 13. System Notifications

The Notifications section alerts administrators to records or activities that may require attention. This keeps important tasks visible on the homepage instead of relying on staff to manually check every section.

## Possible notifications:

- New reservation submitted

- ID awaiting verification

- Payment requiring attention

- Agreement requiring action

- Plot information requiring checking

## Feature : Cemetery Map

## 1. Cemetery Selection

The Cemetery Selection feature allows users to choose which cemetery they want to view and manage before interacting with the map. Since Aevora is designed to accommodate multiple cemeteries, each location will have its own physical layout, plot records, availability, and other relevant information. Once a cemetery is selected, the system will load only the corresponding map and records, preventing confusion between burial spaces from different locations.

- Available Cemeteries:

- Mt. Zion Memorial Park

- Eternal Garden

- Batangas Floral Garden

- Batangas Public Cemetery

- Uses a dropdown selection.

- The selected cemetery determines the map, plots, statistics, and records displayed.

- Cemetery information should remain visible while navigating the map.

## 2. Burial Type Selection

The Burial Type Selection allows users to specify what kind of burial space they are looking for. This is particularly useful because the cemeteries may offer different types of burial spaces, and these spaces may be located in different areas of the cemetery. Instead of manually searching the entire map, users can select a burial type and immediately focus on the corresponding spaces.

- Burial Types:

- Private

- Vertical

- Public

- Functions as a filter on the cemetery map.

- Can be combined with status and section filters.

- The selected burial type should also appear in the Plot Details panel.

## 3. Interactive Cemetery Map

The Interactive Cemetery Map serves as the main visual component of the system. It provides a digital representation of the actual physical layout of the selected cemetery, allowing users to see where individual plots are located in relation to sections, roads, pathways, entrances, chapels, and other relevant landmarks. Users can zoom in, zoom out, move around the map, and select individual plots. This follows the MVP requirement for a GIS-based map that connects the digital plot record to its actual physical location.

- Displays the actual cemetery layout.

- Shows individual burial spaces.

- Displays sections and rows.

- Shows relevant landmarks such as:

- Main entrance

- Chapel

- Roads/pathways

- Supports zooming and panning.

- Allows users to click individual plots.

- Selected plots are visually highlighted.

## 4. Plot Status Visualization

The Plot Status Visualization allows users to immediately understand the condition of each burial space through color coding. Instead of opening every plot record individually, users can look at the map and quickly distinguish available spaces from reserved or occupied ones. The MVP already identifies Available, Reserved, Occupied, and Waiting for Checking as plot statuses.

- 🟢 Available – can be considered for reservation.

- 🔵 Reserved – already reserved by a client.

- 🔴 Occupied – already assigned/occupied.

- 🟡 Pending Verification – reservation or information is still being checked.

- ⚪ Unavailable – temporarily or permanently unavailable for selection.

- Includes a visible map legend.

## 5. Plot Type Filter

The Plot Type Filter allows users to narrow down the plots displayed on the map according to their burial-space category. This makes the map easier to navigate, particularly when a cemetery contains a large number of plots. For example, if a client is specifically looking for a private burial space, the system can focus the map on private plots instead of displaying every burial space in the cemetery.

- Filter options:

- Private

- Vertical

- Public

- Can be used together with the status and section filters.

- Selected plot type appears in the plot information.

## 6. Section Filter

The Section Filter allows users to focus on a particular area of the cemetery. Since a cemetery can contain numerous sections and plots, this feature reduces the amount of information displayed at once and helps users locate a specific area more efficiently. Staff can use this when managing a particular section, while clients can use it when they already know the preferred area.

- Example sections:

- Section A

- Section B

- Section C

- Section D

- Includes an All Sections option.

- Updates the map based on the selected section.

- Can be combined with burial type and status filters.

## 7. Status Filter

The Status Filter provides another way of narrowing the map according to the current condition of the plots. For example, staff may want to see only plots that are available for sale or reservation, while management may want to examine occupied or reserved spaces. This makes the map useful not only for clients but also for cemetery operations and management.

- Filter options:

- Available

- Reserved

- Occupied

- Pending Verification

- Unavailable

- Can be combined with:

- Cemetery

- Burial Type

- Section

## 8. Search Function

The Search Function allows users to quickly locate a particular plot or record without manually scanning the entire cemetery map. When a plot number or supported identifier is entered, Aevora can locate the corresponding record, zoom the map toward its physical location, highlight the plot, and display its information. This supports the MVP's plot-management requirement for searching and viewing specific plots.

- Search by:

- Plot number

- Section

- Client name, where authorized

- Other supported plot identifiers

- Automatically locates the matching plot.

- Highlights the selected plot.

- Opens the Plot Details panel.

## 9. Actual Plot Photograph

The Actual Plot Photograph feature provides a visual reference of the selected burial space. When a user clicks a specific plot on the map, the system displays an actual photograph of that particular plot in the Plot Details panel. This complements the GIS location because the map answers where the plot is, while the photograph allows the user to see what the actual plot looks like. This feature is an enhancement to the MVP's existing plot-information function, which specifies that selected plots should display their relevant details.

- Displays the actual photograph of the selected plot.

- Photo should correspond to the specific plot number.

- Can support multiple photographs.

- Example:

- A-105 → Actual photo of A-105

- A-106 → Actual photo of A-106

- Optional photo gallery:

- Front view

- Side view

- Surrounding area

## 10. Plot Details Panel

The Plot Details Panel displays the complete information of the selected burial space. In the proposed interface, this panel is positioned on the left side of the map, allowing the user to view the photograph and information while still seeing the plot's location on the map. The MVP specifically identifies plot number, section/block, status, availability, price/fees, plot size, and reservation information as relevant plot details.

- Plot Number

- Section

- Row/Plot

- Burial Type

- Plot Size

- Price

- Status

- Availability

- Actual Plot Photograph

- Reservation information, when authorized

## 11. Map and Plot Connection

The Map and Plot Connection ensures that every digital plot record corresponds to a specific physical location on the cemetery map. When a plot is selected from the map, its corresponding record is displayed, and when a plot is searched from the system, its physical location can be shown on the map. This creates a direct connection between the database and the physical cemetery, which is one of the main purposes of using GIS in Aevora.

- Map location ↔ Plot record

- Plot record ↔ Actual photograph

- Plot record ↔ Reservation

- Plot record ↔ Client information

- Plot record ↔ Agreement/payment records, when authorized

## 12. Reserve Plot

The Reserve Plot feature allows an authorized user or client to begin the reservation process after selecting an available burial space. The button should only appear when the plot is eligible for reservation. Selecting it should not immediately finalize the reservation; instead, it should lead the user through Aevora's reservation process, including entering information, submitting identification, verification, confirmation, and agreement creation.

- Available plots display Reserve Plot.

- Occupied plots cannot be reserved.

- Reserved plots cannot be reserved again.

- Reservation flow:

- Select Plot

- Enter Information

- Upload Valid ID

- Information Checking

- Confirmation

- Agreement Creation

## 13. Status-Based Actions

The Status-Based Actions feature ensures that the system provides the appropriate action depending on the condition of the selected plot. This prevents users from attempting actions that are not allowed, such as reserving an already occupied plot. It also allows staff to perform administrative actions on plots that require verification.

- Available

- Reserve Plot

- View Details

- Reserved

- View Reservation

- View Details

- Occupied

- View Details

- Pending Verification

- Review Request, for authorized staff

- Unavailable

- View Details only

## 14. Map/List View

The Map/List View gives users two different ways of accessing cemetery information. The Map View is useful when users need to understand the physical location of burial spaces, while the List View is useful when users need to quickly browse or search through structured plot records.

- Map View

- Physical cemetery layout

- Plot locations

- Sections

- Status colors

- List View

- Plot number

- Section

- Burial type

- Status

- Price

- Availability

## 15. Map Navigation Controls

The Map Navigation Controls allow users to move around and examine the cemetery at different levels of detail. Since the map represents a physical cemetery containing many burial spaces, users need to be able to move from a broad cemetery view into a specific section or individual plot.

- Zoom In

- Zoom Out

- Pan/Move

- Center/Locate

- Select Plot

- Return to Full Cemetery View

## 16. Cemetery Overview Mini Map

The Cemetery Overview Mini Map provides a smaller representation of the entire cemetery while the user is viewing a more detailed portion of the map. For example, when the user zooms into Section A, the mini map can indicate where Section A is located within the entire cemetery. This helps users maintain their sense of location while navigating.

- Displays the overall cemetery.

- Indicates the user's current map area.

- Helps users navigate between sections.

- Can be expanded when necessary.

## 17. Quick Actions

The Quick Actions section provides shortcuts to commonly performed tasks so that staff do not need to navigate through multiple menus. These actions are particularly useful for daily cemetery operations where staff may frequently need to locate plots, review plot records, or generate information.

- Locate Plot

- View All Plots

- Generate Report

- Additional actions may be added based on the user's access level.

## 18. Cemetery-Level Summary Cards

The Summary Cards provide a quick overview of the selected cemetery before the user examines individual plots. These statistics should change depending on the cemetery selected. For example, selecting Mt. Zion Memorial Park should display the statistics for Mt. Zion, while selecting Eternal Garden should display Eternal Garden's statistics.

- Available Plots

- Reserved Plots

- Occupied Plots

- Pending Verification

- Total Revenue

- Statistics should correspond to the currently selected cemetery.

## 19. Cemetery Information

The Cemetery Information section clearly identifies which cemetery is currently being viewed. This is especially important because Aevora manages multiple cemeteries. Displaying the cemetery name near the map provides a constant visual reminder and reduces the possibility of staff or clients interpreting information from the wrong location.

- Cemetery name

- Location/address

- Selected cemetery status

- Optional basic cemetery information

## 20. User Flow Summary

The features work together as one continuous process rather than as separate functions. A typical user can first select a cemetery, choose the desired burial type, apply filters, search or navigate to a plot, select the plot on the physical map, view its actual photograph and information, and then perform the appropriate action. For an available plot, this may lead to the reservation process; for an occupied or reserved plot, the system will restrict the available actions. This supports the MVP's overall process of viewing the map, choosing an available plot, entering client information, verifying documents, confirming the reservation, creating an agreement, and monitoring payment.

- Select Cemetery

- Select Burial Type

- Apply Filters

- Search/Navigate Map

- Select Plot

- View Actual Photograph

- View Plot Details

- Check Availability

- Reserve or Perform Appropriate Action

## Features: Plot

## 1. Plot Records

The Plot Records feature provides a centralized space for managing all cemetery plot information. It allows administrators to view the essential details of each plot and maintain an organized record that can be connected to the cemetery map. This helps ensure that plot information remains consistent between the digital records and the actual cemetery layout.

## Plot information:

- Plot Number

- Cemetery

- Section/Block

- Plot Size

- Price/Fees

- Availability

- Current Status

- Burial Type

## 2. Add Plot

The Add Plot feature allows administrators to create a new plot record when a cemetery space needs to be added to the system. The administrator can enter the necessary information and assign the plot to its appropriate location within the cemetery.

## Information to add:

- Plot Number

- Cemetery

- Section/Block

- Plot Size

- Price/Fees

- Burial Type

- Location on Cemetery Map

- Initial Status

## 3. Edit Plot Information

The Edit Plot Information feature allows administrators to update existing plot records when information changes or corrections are needed. This helps keep the digital plot records accurate and ensures that the information displayed to users remains updated.

## Editable information:

- Plot Number

- Section/Block

- Plot Size

- Price/Fees

- Burial Type

- Plot Location

- Other plot details

## 4. Update Plot Status

The Update Plot Status feature allows administrators to change the current status of a plot based on its actual condition or transaction. Keeping the status updated is important because Aevora's cemetery map uses plot status to show which spaces are available, reserved, occupied, or still waiting for checking.

## Plot statuses:

- 🟢 Available

- 🔵 Reserved

- 🔴 Occupied

- 🟡 Waiting for Checking

## 5. Search Function

The Search Function allows administrators to quickly locate a specific plot without manually browsing through all plot records. This is especially useful for cemeteries with a large number of plots.

## Search by:

- Plot Number

- Section/Block

- Cemetery

- Plot Status

## 6. Filter Function

The Filter Function allows administrators to narrow down plot records based on specific characteristics. This makes it easier to identify plots that meet particular requirements or to review the current status of a

specific group of plots.

## Filter by:

- Cemetery

- Section/Block

- Burial Type

- Plot Status

- Availability

- Price range

## 7. Plot History

The Plot History feature allows administrators to view the previous records and status changes associated with a specific plot. This provides a record of how the plot has been managed over time and helps staff trace important changes made to the plot record. The worksheet specifically identifies view history as one of the plot management functions.

## History information:

- Previous status

- Status changes

- Reservation history

- Assignment history

- Date and time of changes

- User who made the change

## 8. Map Connection

The Map Connection feature links each plot record to its corresponding physical location on the interactive cemetery map. This allows administrators to manage the plot information from the records while ensuring that the same information is reflected on the map. The GIS layer is intended to connect

cemetery records with the exact physical location of each plot.

## Map-linked information:

- Plot Number

- Physical Plot Location

- Section/Block

- Plot Status

- Plot Type

- Plot Details

## 9. Reserve or Assign Plot

The Reserve or Assign Plot feature allows authorized administrators to associate a plot with a reservation or assignment. The system should prevent a plot that is already occupied or reserved from being selected for another reservation, helping reduce incorrect plot assignments.

## Available actions:

- Reserve Plot

- Assign Plot

- View Reservation

- View Client

- Update Status

## 10. Plot Details

The Plot Details feature provides a complete view of an individual plot record. It allows administrators to

review the plot's information and, where applicable, access the related reservation or client record.

## Displayed information:

- Plot Number

- Cemetery

- Section/Block

- Plot Size

- Price/Fees

- Availability

- Current Status

- Reservation Details

- Client Information, where applicable

## 11. Actual Plot Photo

The Actual Plot Photo feature can connect the plot record to a photograph of its actual physical location. This supports the user's intended map design, where selecting a specific plot can show its corresponding

physical appearance alongside its information.

## Photo options:

- Actual plot photograph

- Photo preview

- Associated plot number

- Photo date, if recorded

- Update/replace photo

## 12. Plot List and Map View

The Plot List and Map View feature allows administrators to manage plots either through a structured list or through their physical locations on the cemetery map. The map view is particularly useful for confirming where a plot is located, while the list view provides an efficient way to manage multiple plot

records.

## View options:

- List View

- Map View

- Search and Filter

- Select Plot

- View Plot Details

- Edit Plot Information

The National Engineering University

Golden Country Homes, Alangilan Batangas City, Batangas, Philippines 4200

## Features: Reservations

## 1. Reservation Records

The Reservation Records feature provides a centralized space for managing plot reservation requests submitted by clients. Each reservation connects the client, selected plot, reservation details, and agreement, allowing administrators to manage the complete reservation record without repeatedly entering the same information.

## Reservation information:

- Reservation Number

- Client Name

- Cemetery

- Plot Number

- Reservation Date

- Burial Type

- Reservation Status

- Agreement

## 2. Reservation Requests

The Reservation Requests feature allows administrators to view and manage reservation requests submitted by clients. It provides an organized list of requests so staff can identify new submissions and proceed with the necessary checking and confirmation.

## Request information:

- Client Name

- Selected Plot

- Cemetery

- Date Submitted

- Reservation Status

- Review Action

The National Engineering University

## 3. Client Information Verification

The Client Information Verification feature allows administrators or authorized staff to review the information provided by the client before confirming a reservation. This includes checking the submitted client details and the required identification document. In the MVP, ID checking is performed manually by the administrator or staff.

## Verification information:

- Client Name

- Contact Information

- Submitted ID

- Date Submitted

- Verification Status

- Review Notes, if applicable

## 4. Document Verification

The Document Verification feature allows authorized staff to review the identification document uploaded by the client as part of the reservation process. This provides a verification step before the reservation is confirmed.

## Document options:

- View uploaded ID

- Verify information

- Mark verification status

- Add verification notes

- Request correction, if necessary

## 5. Plot Verification

The Plot Verification feature allows administrators to confirm that the selected plot is still available before completing the reservation. Aevora's reservation process prevents users from reserving plots that are already occupied, reserved, or otherwise unavailable.

## Plot information:

- Plot Number

- Cemetery

- Section/Block

- Plot Status

- Availability

- Plot Details

## 6. Reservation Status

The Reservation Status feature allows administrators to monitor the progress of each reservation from submission to confirmation. It provides a clear indication of which requests still require checking and which reservations have already been processed.

## Possible status:

- Pending

- Under Verification

- Confirmed

- Cancelled

The National Engineering University

Golden Country Homes, Alangilan Batangas City, Batangas, Philippines 4200

## 7. Confirm Reservation

The Confirm Reservation feature allows authorized administrators to finalize a reservation after the client's information, documents, and selected plot have been properly checked. Once confirmed, the reservation can proceed to the agreement creation stage as defined in Aevora's reservation flow.

## Confirmation process:

- Review client information

- Check uploaded ID

- Verify plot availability

- Confirm reservation

- Create agreement

## 8. Agreement Creation

The Agreement Creation feature connects a confirmed reservation to its corresponding agreement. This reduces repetitive data entry because information already provided during the reservation can be carried into the agreement record.

## Linked information:

- Client

- Reservation

- Cemetery

- Plot

- Agreement

## 9. Search Function

The Search Function allows administrators and authorized staff to quickly locate a specific reservation without manually browsing through all reservation records.

## Search by:

- Reservation Number

- Client Name

- Plot Number

- Cemetery

## 10. Filter Function

The Filter Function allows users to narrow down reservation records based on specific criteria. This helps staff focus on particular reservations that require checking, confirmation, or monitoring.

## Filter by:

- Cemetery

- Reservation Status

- Burial Type

- Reservation Date

- Plot Status

## 11. Reservation Details

The Reservation Details feature provides a complete view of an individual reservation. It allows authorized users to review the client, selected plot, reservation information, verification status, and related agreement from one record.

## Displayed information:

- Reservation Number

- Client Information

- Plot Information

- Cemetery

- Reservation Date

- Verification Status

- Reservation Status

- Agreement

## 12. Reservation Monitoring

The Reservation Monitoring feature helps administrators track reservation activities and identify requests that still require action. It provides a centralized view of reservation records so staff can monitor

the process from submission and information checking through confirmation and agreement creation.

## Monitoring includes:

- New reservation requests

- Pending verification

- Confirmed reservations

- Cancelled reservations

- Recent reservations

- Related agreements

## 13. Reservation Flow

The Reservation Flow feature organizes the reservation process into a clear sequence, helping ensure that each required step is completed before the reservation is finalized. The MVP defines the process as Choose Plot → Enter Information → Upload Valid ID → Information Checking → Confirmation

→ Agreement Created.

## Process:

- 1. Choose available plot

- 2. Enter client information

- 3. Upload valid ID

- 4. Information checking

- 5. Confirm reservation

- 6. Create agreement

The National Engineering University

Golden Country Homes, Alangilan Batangas City, Batangas, Philippines 4200

## Feature: Clients

## 1. Client Records

The Client Records feature provides a centralized space for managing and organizing client information within Aevora. It allows administrators and authorized staff to access important client details in one record, making it easier to maintain accurate and organized information while managing cemetery transactions.

## Client information:

- Client ID

- Full Name

- Contact Number

- Email Address

- Client Type

- Registration Date

- Current Status

## 2. Search Function

The Search Function allows administrators and authorized staff to quickly locate a specific client record without manually browsing through the entire client list. Users can search using identifying information to access the corresponding client profile and its related records.

## Search by:

- Client ID

- Full Name

- Contact Number

- Email Address

## 3. Filter Function

The Filter Function allows users to narrow down client records based on specific criteria. This makes it

easier to organize and review clients according to their type, status, or other available information.

## Filter by:

- Client Type

- Client Status

- Registration Date

- Number of Reservations

## 4. Client Profile

The Client Profile provides a detailed view of an individual client's information and related cemetery transactions. It allows authorized users to review the client's records in one place instead of checking separate sections of the system.

## Profile information:

- Personal information

- Contact information

- Client type

- Registration date

- Current status

- Reservation records

- Payment records

- Agreement records

## 5. Reservation Monitoring

The Reservation Monitoring feature allows authorized users to view the reservations associated with a particular client. This helps staff track the client's selected plots and reservation records while keeping the information connected to the client's profile.

## Reservation information:

- Number of reservations

- Reservation details

- Associated plot

- Cemetery

- Reservation status

## 6. Payment Records

The Payment Records feature allows authorized users to access payment information associated with a client's cemetery transactions. This provides a clearer view of the client's payment history and outstanding balances without requiring staff to search through separate records. Aevora's MVP includes payment history, total amount, amount paid, remaining balance, and payment status.

## Payment information:

- Payment history

- Total amount

- Amount paid

- Remaining balance

- Payment status

- Transaction records

## 7. Agreement Records

The Agreement Records feature connects a client's profile with the agreements created through their reservations. This allows authorized users to easily access the corresponding agreement and review its details without having to search for the document separately. Aevora's reservation process connects the client, plot, reservation, and agreement records.

## Agreement information:

- Agreement number

- Agreement type

- Associated plot

- Date signed

- Agreement status

- Agreement document

## 8. Client Status

The Client Status feature allows administrators to monitor the current status of a client record. It provides a quick reference when managing client information and their related transactions.

## Possible status:

- Active

- Inactive

- Pending

## 9. Access and Permissions

The Access and Permissions feature ensures that client information is only accessible according to the user's assigned role. This is important because client records may contain personal and transaction-related information. Aevora's MVP specifies different access levels for administrators, staff, clients, and management.

## User access:

- Administrator – Manage and view client records

- Staff – Access assigned client-related functions

- Client – Access their own information and records

- Management – Access relevant client information and reports

The National Engineering University

Golden Country Homes, Alangilan Batangas City, Batangas, Philippines 4200

## Feature: Payments

## 1. Payment Records

The Payment Records feature provides a centralized space for administrators and authorized staff to manage payment transactions related to cemetery services. It organizes payment information in one record, making it easier to monitor transactions, verify payment status, and track the financial records associated with each client and cemetery plot. Aevora's MVP supports payment history, total amount, amount paid, remaining balance, payment status, and transaction records.

## Payment information:

- Receipt Number

- Client Name

- Plot Number

- Payment Type

- Amount

- Payment Date

- Payment Status

- Payment Method

## 2. Search Function

The Search Function allows administrators and authorized staff to quickly locate a specific payment transaction without manually checking the entire payment list. Users can search using identifying transaction or client information to access the corresponding payment record.

## Search by:

- Receipt Number

- Client Name

- Plot Number

- Payment Reference

## 3. Filter Function

The Filter Function allows users to narrow down payment records based on specific criteria. This helps administrators focus on particular transactions, payment statuses, or payment periods when reviewing

financial records.

## Filter by:

- Payment Status

- Payment Type

- Payment Method

- Payment Date

- Cemetery

## 4. Payment Summary

The Payment Summary provides an overview of the current payment situation within the cemetery. It allows administrators to quickly see the overall status of recorded transactions without opening each payment record individually.

## Summary categories:

- Paid

- Pending

- Overdue

- Total amount collected

- Remaining balance

## 5. Payment Status

The Payment Status indicates the current condition of each payment transaction. This allows administrators to identify which payments have already been completed and which transactions may still require follow-up.

## Possible status:

- Paid

- Pending

- Overdue

## 6. Payment Details

The Payment Details feature allows authorized users to open a specific transaction and review its complete payment information. This provides a more detailed view of the transaction while keeping the payment record connected to the corresponding client and plot.

## Displayed information:

- Receipt Number

- Client Name

- Plot Number

- Payment Type

- Amount

- Payment Date

- Payment Method

- Payment Status

## 7. Payment History

The Payment History feature allows administrators to review previous payments associated with a client

or cemetery transaction. This helps users monitor the amount already paid and determine any remaining balance. The MVP specifically includes payment history, total amount, amount paid, and remaining

balance.

## Payment history includes:

- Previous transactions

- Total amount

- Amount paid

- Remaining balance

- Payment status

- Transaction records

## 8. Linked Records

The Linked Records feature connects payment information with the client's and plot's records. This allows authorized users to trace a payment transaction back to the corresponding cemetery transaction and

review related information without manually searching through separate records.

## Linked information:

- Client

- Cemetery

- Plot

- Reservation

- Agreement

- Payment transaction

## 9. Payment Monitoring

The Payment Monitoring feature helps administrators continuously track outstanding and completed payments. By organizing payment records according to their current status, staff can identify transactions

that may require follow-up and maintain more accurate financial records.

## Monitoring information:

- Paid payments

- Pending payments

- Overdue payments

- Outstanding balances

- Recent transactions

## 10. Access and Permissions

The Access and Permissions feature controls who can view or manage payment information according to their assigned role. This is important because payment records contain sensitive financial information.

Aevora's MVP uses different access levels for administrators, staff, clients, and management.

## User access:

- Administrator – Manage and monitor payment records

- Staff – Access assigned payment-related functions

- Client – View their own payment records

- Management – Access relevant payment information and reports

The National Engineering University

Golden Country Homes, Alangilan Batangas City, Batangas, Philippines 4200

## Feature: Agreements

## 1. Agreement Records

The Agreement Records feature serves as a centralized space for managing all cemetery agreements created through the reservation process. It allows administrators and authorized staff to view and organize agreements while keeping each document connected to its corresponding client and burial plot. This reduces the need to search through separate physical or digital records and makes agreement management more organized.

## Specifications:

- Agreement Number

- Client Name

- Plot Number

- Cemetery

- Agreement Type

- Date Signed

- Agreement Status

## 2. Search Function

The Search Function allows administrators and authorized staff to quickly locate a specific agreement without manually browsing through the entire list. Users can enter relevant information to find the corresponding agreement record.

## Search by:

- Agreement Number

- Client Name

- Plot Number

- Cemetery

## 3. Filter Function

BATANGAS STATE UNIVERSITY

The National Engineering University

The Filter Function helps users narrow down agreement records based on specific criteria. This is useful

when staff need to review a particular group of agreements instead of viewing all records at once.

## Filter by:

- Cemetery

- Agreement Type

- Agreement Status

- Date

## 4. View Agreement

The View Agreement feature allows authorized users to open a selected agreement and review its

complete information. It provides a more detailed view than the summary displayed in the agreement list.

## Information displayed:

- Agreement details

- Client information

- Plot information

- Agreement type

- Date signed

- Current status

## 5. Download Agreement

The Download Agreement feature allows authorized users to obtain a digital copy of a selected

agreement for documentation and record-keeping purposes.

## Options:

- View digital agreement

- Download agreement document

- Access according to user permissions

## 6. Linked Records

The Linked Records feature connects an agreement with its related cemetery records. This allows staff to move between related information without having to manually search for each record separately. The reservation process specifically connects the client, plot, reservation, and agreement records.

## Linked information:

- Client

- Cemetery

- Burial plot

- Reservation

- Agreement

- Payment information, where applicable

## 7. Access and Permissions

The Access and Permissions feature ensures that agreement information is only accessible according to the user's role. This helps protect sensitive client information while allowing each type of user to perform the functions relevant to them.

## User access:

- Administrator – Full access to agreement records and management functions

The National Engineering University

Golden Country Homes, Alangilan Batangas City, Batangas, Philippines 4200

- Staff – Access to assigned agreement-related functions

- Client – Access to their own agreements

- Management – Access to relevant records and reports

## 8. Agreement Status Monitoring

The Agreement Status Monitoring feature allows authorized users to quickly determine the current state of an agreement. This helps staff identify records that may still require processing or have already been finalized.

## Possible status:

- Pending

- Active

- Completed

- Cancelled

Format to follow: Feature → paragraph explanation → specifications/options in bullets. This keeps the description readable while making the actual system requirements easy to identify.

## Feature: Reports

## 1. Report Dashboard

The Report Dashboard provides administrators with a centralized view of important cemetery information and key records. It summarizes essential data in an organized format, allowing users to monitor cemetery activities without having to review individual records one by one. This supports faster monitoring and easier access to information needed for management and decision-making.

## Summary information:

- Total plots

- Available plots

- Reserved plots

- Occupied plots

- Total clients

- Recent reservations

- Payment status

- Agreement information

- 2. Plot Occupancy Report

The Plot Occupancy Report provides information about the current utilization of cemetery plots. It allows administrators to monitor how many plots are available, reserved, or occupied, helping them

understand the current status and utilization of cemetery spaces.

## Report information:

- Available plots

- Reserved plots

- Occupied plots

- Plot number

- Cemetery

- Section/Block

- Burial type

## 3. Reservation Report

The Reservation Report provides a record of reservations made within the system. It helps administrators monitor recent and existing reservations and review the corresponding client and plot

information.

## Report information:

- Reservation number

- Client name

- Plot number

- Cemetery

- Reservation date

- Reservation status

## 4. Payment Report

The Payment Report summarizes payment-related information recorded in Aevora. It allows authorized users to monitor payment status and review the financial records associated with cemetery transactions.

The MVP includes payment history, total amount, amount paid, remaining balance, and payment status.

## Report information:

- Client name

- Agreement/transaction reference

- Total amount

- Amount paid

- Remaining balance

- Payment status

- Transaction record

## 5. Agreement Report

The Agreement Report provides administrators with an organized view of cemetery agreements and their current records. It allows users to monitor agreement details and review which agreements have been created from reservations.

## Report information:

- Agreement number

- Client name

- Plot number

- Cemetery

- Agreement type

- Date signed

- Agreement status

## 6. Client Report

The Client Report provides a consolidated view of client records maintained within Aevora. It helps authorized users review the number of clients and their related cemetery transactions while maintaining appropriate access to sensitive information.

## Report information:

- Client name

- Contact information

- Associated cemetery

- Plot number

- Reservation information

- Agreement information

## 7. Recent Reports

The Recent Reports feature provides a list of recently generated reports for easier reference and record keeping. Instead of generating the same report repeatedly, authorized users can access recently prepared reports according to the system's available records and permissions.

## Displayed information:

- Report name

- Report type

- Date generated

- Generated by

- Report status

- View/Download option

## 8. Report Generation and Download

The Report Generation and Download feature allows administrators to generate reports based on the information stored in Aevora and obtain a digital copy for documentation or further review. This makes it easier to maintain organized records and share authorized reports when needed.

## Options:

- Select report type

- Apply available filters

- Generate report

- View report

- Download report

- Review previously generated reports