# LearnSphere System Architecture

## Overview
LearnSphere utilizes a standard 3-tier architecture:
1. **Presentation Layer**: React.js SPA (Single Page Application)
2. **Application Layer**: PHP 8 RESTful APIs
3. **Data Layer**: MySQL Database

## Component Diagram
[React Frontend] <---(JSON/HTTP)---> [PHP API Backend] <---(PDO/SQL)---> [MySQL Database]

## Technologies
- **Frontend**: React 18, React Router DOM, Bootstrap 5, Axios for HTTP requests.
- **Backend**: Vanilla PHP 8, PDO for database interaction.
- **Database**: MySQL 8+ with InnoDB engine.
