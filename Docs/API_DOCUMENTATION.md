# WebViewer V2 API Documentation

## Table of Contents
1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Component APIs](#component-apis)
   - [Users](#users)
   - [Clients](#clients)
   - [Projects](#projects)
   - [Basemaps](#basemaps)
   - [Layers](#layers)
   - [Styling](#styling)
   - [Functions](#functions)
   - [FCC BDC](#fcc-bdc)
4. [CRUD Operations Status](#crud-operations-status)
5. [Missing CRUD Operations](#missing-crud-operations)

## Overview

Base URL: `http://your-domain/api/v1/`

All API endpoints are prefixed with `/api/v1/`. The API follows RESTful conventions with standard HTTP methods:
- GET: Retrieve resources
- POST: Create new resources
- PUT/PATCH: Update existing resources
- DELETE: Remove resources

## Authentication

The API uses JWT (JSON Web Token) authentication.

### Login
```http
POST /api/v1/auth/login/
Content-Type: application/json

{
  "username": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "user": {
    "id": 1,
    "username": "user@example.com",
    "full_name": "John Doe",
    "is_admin": false
  }
}
```

### Token Refresh
```http
POST /api/v1/auth/refresh/
Content-Type: application/json

{
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

### Using Authentication
Include the access token in the Authorization header:
```http
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
```

## Component APIs

### Users

#### 1. User Management

**Model Fields:**
- `id` (integer): Unique identifier
- `username` (string, required, unique): Username for login
- `email` (string, optional): Email address
- `full_name` (string, optional): Full name of the user
- `is_active` (boolean): Whether the user account is active
- `is_admin` (boolean): Admin privileges
- `is_staff` (boolean): Staff privileges
- `client` (integer, optional): Associated client ID
- `created_at` (datetime): Creation timestamp
- `updated_at` (datetime): Last update timestamp

**Endpoints:**

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/users/` | List all users |
| GET | `/api/v1/users/{id}/` | Get user details |
| POST | `/api/v1/users/` | Create new user |
| PUT | `/api/v1/users/{id}/` | Update user |
| PATCH | `/api/v1/users/{id}/` | Partial update user |
| DELETE | `/api/v1/users/{id}/` | Delete user |

**Create User Example:**
```http
POST /api/v1/users/
Content-Type: application/json
Authorization: Bearer {token}

{
  "username": "newuser",
  "email": "newuser@example.com",
  "full_name": "New User",
  "password": "secure_password",
  "is_active": true,
  "client": 1
}
```

**Response:**
```json
{
  "id": 5,
  "username": "newuser",
  "email": "newuser@example.com",
  "full_name": "New User",
  "is_active": true,
  "is_admin": false,
  "is_staff": false,
  "client": 1,
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z"
}
```

#### 2. Audit Logs

**Model Fields:**
- `id` (integer): Unique identifier
- `user` (integer): User who performed the action
- `action` (string): Description of the action
- `action_details` (json): Additional details about the action
- `occurred_at` (datetime): When the action occurred
- `ip_address` (string): IP address of the user

**Endpoints:**

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/audit-logs/` | List all audit logs |
| GET | `/api/v1/audit-logs/{id}/` | Get audit log details |

**Note:** Audit logs are read-only and automatically created by the system.

### Clients

#### 1. Client Management

**Model Fields:**
- `id` (integer): Unique identifier
- `name` (string, required, unique): Client organization name
- `contact_email` (string, optional): Contact email
- `contact_phone` (string, optional): Contact phone
- `is_active` (boolean): Whether the client is active
- `created_at` (datetime): Creation timestamp
- `updated_at` (datetime): Last update timestamp

**Endpoints:**

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/clients/` | List all clients |
| GET | `/api/v1/clients/{id}/` | Get client details |
| POST | `/api/v1/clients/` | Create new client |
| PUT | `/api/v1/clients/{id}/` | Update client |
| PATCH | `/api/v1/clients/{id}/` | Partial update client |
| DELETE | `/api/v1/clients/{id}/` | Delete client |

**Create Client Example:**
```http
POST /api/v1/clients/
Content-Type: application/json
Authorization: Bearer {token}

{
  "name": "Acme Corporation",
  "contact_email": "admin@acme.com",
  "contact_phone": "+1-555-0123",
  "is_active": true
}
```

**Response:**
```json
{
  "id": 3,
  "name": "Acme Corporation",
  "contact_email": "admin@acme.com",
  "contact_phone": "+1-555-0123",
  "is_active": true,
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z"
}
```

#### 2. Client-Project Associations

**Model Fields:**
- `id` (integer): Unique identifier
- `client` (integer, required): Client ID
- `project` (integer, required): Project ID
- `unique_link` (string): Unique access link (auto-generated)
- `is_active` (boolean): Whether the association is active
- `expires_at` (datetime, optional): Expiration date
- `last_accessed` (datetime, optional): Last access timestamp

**Endpoints:**

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/client-projects/` | List all client-project associations |
| GET | `/api/v1/client-projects/{id}/` | Get association details |
| POST | `/api/v1/client-projects/` | Create new association |
| PUT | `/api/v1/client-projects/{id}/` | Update association |
| PATCH | `/api/v1/client-projects/{id}/` | Partial update association |
| DELETE | `/api/v1/client-projects/{id}/` | Delete association |

**Create Association Example:**
```http
POST /api/v1/client-projects/
Content-Type: application/json
Authorization: Bearer {token}

{
  "client": 3,
  "project": 5,
  "is_active": true,
  "expires_at": "2024-12-31T23:59:59Z"
}
```

### Projects

**Model Fields:**
- `id` (integer): Unique identifier
- `name` (string, required): Project name
- `description` (string, optional): Project description
- `is_public` (boolean): Whether the project is publicly accessible
- `is_active` (boolean): Whether the project is active
- `default_center_lat` (float): Default latitude for map center
- `default_center_lng` (float): Default longitude for map center
- `default_zoom_level` (integer): Default zoom level
- `map_controls` (json): Map control configurations
- `map_options` (json): Map option configurations
- `max_zoom` (integer): Maximum zoom level allowed
- `min_zoom` (integer): Minimum zoom level allowed
- `state_abbr` (string): State abbreviation
- `public_access_token` (string): Token for public access (auto-generated)
- `created_by_user` (integer): User who created the project
- `created_at` (datetime): Creation timestamp
- `updated_at` (datetime): Last update timestamp

**Endpoints:**

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/projects/` | List all projects |
| GET | `/api/v1/projects/{id}/` | Get project details |
| POST | `/api/v1/projects/` | Create new project |
| PUT | `/api/v1/projects/{id}/` | Update project |
| PATCH | `/api/v1/projects/{id}/` | Partial update project |
| DELETE | `/api/v1/projects/{id}/` | Delete project |
| GET | `/api/v1/constructor/{project_id}/` | Get project constructor data |
| GET | `/api/v1/constructor/public/{token}/` | Get public project data |

**Create Project Example:**
```http
POST /api/v1/projects/
Content-Type: application/json
Authorization: Bearer {token}

{
  "name": "Urban Planning Project",
  "description": "City development analysis",
  "is_public": false,
  "is_active": true,
  "default_center_lat": 38.9072,
  "default_center_lng": -77.0369,
  "default_zoom_level": 10,
  "state_abbr": "DC",
  "min_zoom": 5,
  "max_zoom": 18,
  "map_controls": {
    "zoomControl": true,
    "scaleControl": true,
    "attributionControl": false
  },
  "map_options": {
    "scrollWheelZoom": true,
    "doubleClickZoom": true
  }
}
```

### Basemaps

#### 1. Basemap Providers

**Model Fields:**
- `id` (integer): Unique identifier
- `name` (string, required, unique): Basemap name
- `description` (string, optional): Description
- `provider` (string): Provider type (google, openstreetmap, bing, esri, etc.)
- `url_template` (string, optional): Tile URL template
- `api_key` (string, optional): API key for the provider
- `options` (json): Additional configuration options
- `attribution` (string, optional): Attribution text
- `preview_image` (binary, optional): Preview image
- `min_zoom` (integer): Minimum zoom level
- `max_zoom` (integer): Maximum zoom level
- `is_system` (boolean): Whether it's a system basemap
- `created_by_user` (integer): User who created it
- `created_at` (datetime): Creation timestamp
- `updated_at` (datetime): Last update timestamp

**Endpoints:**

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/basemaps/` | List all basemaps |
| GET | `/api/v1/basemaps/{id}/` | Get basemap details |
| POST | `/api/v1/basemaps/` | Create new basemap |
| PUT | `/api/v1/basemaps/{id}/` | Update basemap |
| PATCH | `/api/v1/basemaps/{id}/` | Partial update basemap |
| DELETE | `/api/v1/basemaps/{id}/` | Delete basemap |

**Create Basemap Example:**
```http
POST /api/v1/basemaps/
Content-Type: application/json
Authorization: Bearer {token}

{
  "name": "Custom Satellite",
  "description": "High-resolution satellite imagery",
  "provider": "custom",
  "url_template": "https://tiles.example.com/{z}/{x}/{y}.png",
  "attribution": "© Example Imagery Provider",
  "min_zoom": 0,
  "max_zoom": 19,
  "options": {
    "subdomains": ["a", "b", "c"],
    "tileSize": 256
  }
}
```

#### 2. Project-Basemap Associations

**Model Fields:**
- `id` (integer): Unique identifier
- `project` (integer, required): Project ID
- `basemap` (integer, required): Basemap ID
- `is_default` (boolean): Whether this is the default basemap
- `display_order` (integer): Display order in the list
- `custom_options` (json): Project-specific options
- `created_at` (datetime): Creation timestamp
- `updated_at` (datetime): Last update timestamp

**Endpoints:**

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/project-basemaps/` | List all project-basemap associations |
| GET | `/api/v1/project-basemaps/{id}/` | Get association details |
| POST | `/api/v1/project-basemaps/` | Create new association |
| PUT | `/api/v1/project-basemaps/{id}/` | Update association |
| PATCH | `/api/v1/project-basemaps/{id}/` | Partial update association |
| DELETE | `/api/v1/project-basemaps/{id}/` | Delete association |

### Layers

#### 1. Layer Types

**Model Fields:**
- `id` (integer): Unique identifier
- `type_name` (string, required, unique): Type name
- `description` (string, optional): Description
- `default_style` (json): Default styling configuration
- `icon_type` (string, optional): Icon type identifier
- `icon_options` (json): Icon configuration options
- `is_system` (boolean): Whether it's a system type
- `created_at` (datetime): Creation timestamp
- `updated_at` (datetime): Last update timestamp

**Endpoints:**

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/layer-types/` | List all layer types |
| GET | `/api/v1/layer-types/{id}/` | Get layer type details |
| POST | `/api/v1/layer-types/` | Create new layer type |
| PUT | `/api/v1/layer-types/{id}/` | Update layer type |
| PATCH | `/api/v1/layer-types/{id}/` | Partial update layer type |
| DELETE | `/api/v1/layer-types/{id}/` | Delete layer type |

#### 2. Layer Groups

**Model Fields:**
- `id` (integer): Unique identifier
- `project` (integer, required): Project ID
- `name` (string, required): Group name
- `display_order` (integer): Display order
- `is_visible_by_default` (boolean): Default visibility
- `is_expanded_by_default` (boolean): Default expansion state
- `created_at` (datetime): Creation timestamp
- `updated_at` (datetime): Last update timestamp

**Endpoints:**

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/layer-groups/` | List all layer groups |
| GET | `/api/v1/layer-groups/{id}/` | Get layer group details |
| POST | `/api/v1/layer-groups/` | Create new layer group |
| PUT | `/api/v1/layer-groups/{id}/` | Update layer group |
| PATCH | `/api/v1/layer-groups/{id}/` | Partial update layer group |
| DELETE | `/api/v1/layer-groups/{id}/` | Delete layer group |

#### 3. Project Layers

**Model Fields:**
- `id` (integer): Unique identifier
- `project_layer_group` (integer, required): Layer group ID
- `layer_type` (integer, required): Layer type ID
- `name` (string, required): Layer name
- `description` (string, optional): Description
- `style` (json): Styling configuration
- `z_index` (integer): Z-index for layering
- `is_visible_by_default` (boolean): Default visibility
- `min_zoom_visibility` (integer): Minimum zoom for visibility
- `max_zoom_visibility` (integer): Maximum zoom for visibility
- `marker_type` (string, optional): Marker type
- `marker_image_url` (string, optional): Marker image URL
- `marker_options` (json): Marker configuration
- `enable_clustering` (boolean): Enable point clustering
- `clustering_options` (json): Clustering configuration
- `enable_labels` (boolean): Enable labels
- `label_options` (json): Label configuration
- `marker_library` (integer, optional): Marker library ID
- `popup_template` (integer, optional): Popup template ID
- `is_public` (boolean): Public visibility
- `feature_count` (integer): Number of features
- `data_source` (string, optional): Data source information
- `attribution` (string, optional): Attribution text
- `original_crs` (string, optional): Original CRS
- `target_crs` (string): Target CRS (default: EPSG:4326)
- `upload_file_type` (string, optional): Upload file type
- `upload_file_name` (string, optional): Upload file name
- `upload_status` (string): Upload status
- `upload_error` (string, optional): Upload error details
- `created_at` (datetime): Creation timestamp
- `updated_at` (datetime): Last update timestamp

**Endpoints:**

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/layers/` | List all layers |
| GET | `/api/v1/layers/{id}/` | Get layer details |
| POST | `/api/v1/layers/` | Create new layer |
| PUT | `/api/v1/layers/{id}/` | Update layer |
| PATCH | `/api/v1/layers/{id}/` | Partial update layer |
| DELETE | `/api/v1/layers/{id}/` | Delete layer |
| GET | `/api/v1/data/{layer_id}/` | Get layer data (GeoJSON) |
| GET | `/api/v1/data-fast/{layer_id}/` | Get layer data (optimized) |
| GET | `/api/v1/data-fast/{layer_id}/bbox/` | Get layer data within bbox |
| POST | `/api/v1/upload/` | Upload layer file |
| POST | `/api/v1/complete_upload/` | Complete file upload |

**Create Layer Example:**
```http
POST /api/v1/layers/
Content-Type: application/json
Authorization: Bearer {token}

{
  "project_layer_group": 2,
  "layer_type": 1,
  "name": "Customer Locations",
  "description": "Customer site locations",
  "is_visible_by_default": true,
  "min_zoom_visibility": 5,
  "max_zoom_visibility": 18,
  "enable_clustering": true,
  "clustering_options": {
    "maxClusterRadius": 50,
    "showCoverageOnHover": true
  },
  "style": {
    "color": "#FF5500",
    "fillColor": "#FF5500",
    "fillOpacity": 0.7,
    "weight": 2
  }
}
```

#### 4. Layer Features (Data)

**Model Fields:**
- `id` (integer): Unique identifier
- `project_layer` (integer, required): Layer ID
- `geometry` (geometry, required): Geographic geometry (Point, LineString, Polygon, etc.)
- `properties` (json): Feature properties
- `feature_id` (string): Unique feature identifier
- `bbox` (polygon): Bounding box (auto-calculated)
- `created_at` (datetime): Creation timestamp

**Endpoints:**

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/features/` | List all features |
| GET | `/api/v1/features/{id}/` | Get feature details |
| POST | `/api/v1/features/` | Create new feature |
| PUT | `/api/v1/features/{id}/` | Update feature |
| PATCH | `/api/v1/features/{id}/` | Partial update feature |
| DELETE | `/api/v1/features/{id}/` | Delete feature |

**Create Feature Example:**
```http
POST /api/v1/features/
Content-Type: application/json
Authorization: Bearer {token}

{
  "project_layer": 5,
  "geometry": {
    "type": "Point",
    "coordinates": [-77.0369, 38.9072]
  },
  "properties": {
    "name": "Site A",
    "address": "123 Main St",
    "status": "active",
    "capacity": 100
  }
}
```

#### 5. Layer Permissions

**Model Fields:**
- `id` (integer): Unique identifier
- `project_layer` (integer, required): Layer ID
- `client_project` (integer, required): Client-Project association ID
- `can_view` (boolean): View permission
- `can_edit` (boolean): Edit permission
- `can_export` (boolean): Export permission
- `created_at` (datetime): Creation timestamp
- `updated_at` (datetime): Last update timestamp

**Endpoints:**

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/layer-permissions/` | List all permissions |
| GET | `/api/v1/layer-permissions/{id}/` | Get permission details |
| POST | `/api/v1/layer-permissions/` | Create new permission |
| PUT | `/api/v1/layer-permissions/{id}/` | Update permission |
| PATCH | `/api/v1/layer-permissions/{id}/` | Partial update permission |
| DELETE | `/api/v1/layer-permissions/{id}/` | Delete permission |

#### 6. CBRS Licenses

**Model Fields:**
- `id` (integer): Unique identifier
- `county_fips` (string, required): County FIPS code
- `county_name` (string, required): County name
- `state_abbr` (string, required): State abbreviation
- `channel` (string, required): Channel identifier
- `bidder` (string, required): Bidder name
- `license_date` (date, optional): License date
- `frequency_mhz` (float, optional): Frequency in MHz
- `created_at` (datetime): Creation timestamp
- `updated_at` (datetime): Last update timestamp

**Endpoints:**

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/cbrs-licenses/` | List all CBRS licenses |
| GET | `/api/v1/cbrs-licenses/{id}/` | Get license details |
| POST | `/api/v1/cbrs-licenses/` | Create new license |
| PUT | `/api/v1/cbrs-licenses/{id}/` | Update license |
| PATCH | `/api/v1/cbrs-licenses/{id}/` | Partial update license |
| DELETE | `/api/v1/cbrs-licenses/{id}/` | Delete license |

### Styling

#### 1. Marker Library

**Model Fields:**
- `id` (integer): Unique identifier
- `name` (string, required, unique): Marker name
- `description` (string, optional): Description
- `icon_url` (string, optional): Icon URL
- `icon_type` (string): Type (image, svg, font, emoji, circle, custom)
- `icon_data` (binary, optional): Icon data
- `default_options` (json): Default configuration
- `default_size` (integer): Default size in pixels
- `default_anchor` (string): Anchor position
- `default_color` (string, optional): Default color
- `is_system` (boolean): System marker
- `tags` (string, optional): Comma-separated tags
- `category` (string, optional): Category
- `created_by_user` (integer): Creator user ID
- `created_at` (datetime): Creation timestamp
- `updated_at` (datetime): Last update timestamp

**Endpoints:**

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/markers/` | List all markers |
| GET | `/api/v1/markers/{id}/` | Get marker details |
| POST | `/api/v1/markers/` | Create new marker |
| PUT | `/api/v1/markers/{id}/` | Update marker |
| PATCH | `/api/v1/markers/{id}/` | Partial update marker |
| DELETE | `/api/v1/markers/{id}/` | Delete marker |

**Create Marker Example:**
```http
POST /api/v1/markers/
Content-Type: application/json
Authorization: Bearer {token}

{
  "name": "Warning Icon",
  "description": "Warning triangle marker",
  "icon_type": "svg",
  "default_size": 32,
  "default_anchor": "bottom",
  "default_color": "#FFA500",
  "tags": "warning,alert,caution",
  "category": "alerts",
  "default_options": {
    "iconSize": [32, 32],
    "iconAnchor": [16, 32]
  }
}
```

#### 2. Popup Templates

**Model Fields:**
- `id` (integer): Unique identifier
- `name` (string, required, unique): Template name
- `description` (string, optional): Description
- `html_template` (string, required): HTML template with placeholders
- `field_mappings` (json): Field mapping configuration
- `css_styles` (string, optional): CSS styles
- `max_width` (integer): Maximum width in pixels
- `max_height` (integer): Maximum height in pixels
- `include_zoom_to_feature` (boolean): Include zoom button
- `is_system` (boolean): System template
- `created_by_user` (integer): Creator user ID
- `created_at` (datetime): Creation timestamp
- `updated_at` (datetime): Last update timestamp

**Endpoints:**

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/popup-templates/` | List all templates |
| GET | `/api/v1/popup-templates/{id}/` | Get template details |
| POST | `/api/v1/popup-templates/` | Create new template |
| PUT | `/api/v1/popup-templates/{id}/` | Update template |
| PATCH | `/api/v1/popup-templates/{id}/` | Partial update template |
| DELETE | `/api/v1/popup-templates/{id}/` | Delete template |

**Create Popup Template Example:**
```http
POST /api/v1/popup-templates/
Content-Type: application/json
Authorization: Bearer {token}

{
  "name": "Site Info Popup",
  "description": "Template for site information",
  "html_template": "<div class='popup-content'><h3>{{name}}</h3><p>Address: {{address}}</p><p>Status: <span class='status-{{status}}'>{{status}}</span></p></div>",
  "field_mappings": {
    "name": "properties.name",
    "address": "properties.address",
    "status": "properties.status"
  },
  "css_styles": ".popup-content { padding: 10px; } .status-active { color: green; } .status-inactive { color: red; }",
  "max_width": 300,
  "max_height": 200,
  "include_zoom_to_feature": true
}
```

#### 3. Style Library

**Model Fields:**
- `id` (integer): Unique identifier
- `name` (string, required, unique): Style name
- `description` (string, optional): Description
- `style_definition` (json, required): Style configuration
- `style_type` (string): Type (point, line, polygon, label, universal)
- `is_system` (boolean): System style
- `preview_image` (binary, optional): Preview image
- `created_by_user` (integer): Creator user ID
- `created_at` (datetime): Creation timestamp
- `updated_at` (datetime): Last update timestamp

**Endpoints:**

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/styles/` | List all styles |
| GET | `/api/v1/styles/{id}/` | Get style details |
| POST | `/api/v1/styles/` | Create new style |
| PUT | `/api/v1/styles/{id}/` | Update style |
| PATCH | `/api/v1/styles/{id}/` | Partial update style |
| DELETE | `/api/v1/styles/{id}/` | Delete style |

#### 4. Color Palettes

**Model Fields:**
- `id` (integer): Unique identifier
- `name` (string, required, unique): Palette name
- `description` (string, optional): Description
- `colors` (json, required): List of colors
- `palette_type` (string): Type (sequential, diverging, qualitative, custom)
- `is_system` (boolean): System palette
- `created_by_user` (integer): Creator user ID
- `created_at` (datetime): Creation timestamp
- `updated_at` (datetime): Last update timestamp

**Endpoints:**

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/color-palettes/` | List all palettes |
| GET | `/api/v1/color-palettes/{id}/` | Get palette details |
| POST | `/api/v1/color-palettes/` | Create new palette |
| PUT | `/api/v1/color-palettes/{id}/` | Update palette |
| PATCH | `/api/v1/color-palettes/{id}/` | Partial update palette |
| DELETE | `/api/v1/color-palettes/{id}/` | Delete palette |

**Create Color Palette Example:**
```http
POST /api/v1/color-palettes/
Content-Type: application/json
Authorization: Bearer {token}

{
  "name": "Heat Map Colors",
  "description": "Colors for heat map visualization",
  "palette_type": "sequential",
  "colors": ["#FFEDA0", "#FED976", "#FEB24C", "#FD8D3C", "#FC4E2A", "#E31A1C", "#BD0026", "#800026"]
}
```

### Functions

#### 1. Layer Functions

**Model Fields:**
- `id` (integer): Unique identifier
- `name` (string, required, unique): Function name
- `description` (string, optional): Description
- `function_type` (string): Type (clustering, filtering, styling, analysis, etc.)
- `function_code` (string, optional): JavaScript implementation
- `function_config` (json): Default configuration
- `is_system` (boolean): System function
- `created_by_user` (integer): Creator user ID
- `created_at` (datetime): Creation timestamp
- `updated_at` (datetime): Last update timestamp

**Endpoints:**

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/layer-functions/` | List all functions |
| GET | `/api/v1/layer-functions/{id}/` | Get function details |
| POST | `/api/v1/layer-functions/` | Create new function |
| PUT | `/api/v1/layer-functions/{id}/` | Update function |
| PATCH | `/api/v1/layer-functions/{id}/` | Partial update function |
| DELETE | `/api/v1/layer-functions/{id}/` | Delete function |

#### 2. Project Layer Functions

**Model Fields:**
- `id` (integer): Unique identifier
- `project_layer` (integer, required): Layer ID
- `layer_function` (integer, required): Function ID
- `function_arguments` (json): Function arguments
- `enabled` (boolean): Whether function is enabled
- `priority` (integer): Execution priority
- `created_at` (datetime): Creation timestamp
- `updated_at` (datetime): Last update timestamp

**Endpoints:**

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/project-layer-functions/` | List all associations |
| GET | `/api/v1/project-layer-functions/{id}/` | Get association details |
| POST | `/api/v1/project-layer-functions/` | Create new association |
| PUT | `/api/v1/project-layer-functions/{id}/` | Update association |
| PATCH | `/api/v1/project-layer-functions/{id}/` | Partial update association |
| DELETE | `/api/v1/project-layer-functions/{id}/` | Delete association |

#### 3. Map Tools

**Model Fields:**
- `id` (integer): Unique identifier
- `name` (string, required, unique): Tool name
- `description` (string, optional): Description
- `tool_type` (string): Type (measure_distance, draw_point, export_data, etc.)
- `icon` (string, optional): Tool icon
- `tool_code` (string, optional): JavaScript implementation
- `default_options` (json): Default configuration
- `ui_position` (string): UI position (topright, topleft, etc.)
- `is_system` (boolean): System tool
- `created_by_user` (integer): Creator user ID
- `created_at` (datetime): Creation timestamp
- `updated_at` (datetime): Last update timestamp

**Endpoints:**

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/map-tools/` | List all tools |
| GET | `/api/v1/map-tools/{id}/` | Get tool details |
| POST | `/api/v1/map-tools/` | Create new tool |
| PUT | `/api/v1/map-tools/{id}/` | Update tool |
| PATCH | `/api/v1/map-tools/{id}/` | Partial update tool |
| DELETE | `/api/v1/map-tools/{id}/` | Delete tool |

#### 4. Project Tools

**Model Fields:**
- `id` (integer): Unique identifier
- `project` (integer, required): Project ID
- `tool` (integer, required): Tool ID
- `is_enabled` (boolean): Whether tool is enabled
- `display_order` (integer): Display order
- `tool_options` (json): Tool-specific options
- `custom_position` (string, optional): Custom UI position
- `created_at` (datetime): Creation timestamp
- `updated_at` (datetime): Last update timestamp

**Endpoints:**

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/project-tools/` | List all associations |
| GET | `/api/v1/project-tools/{id}/` | Get association details |
| POST | `/api/v1/project-tools/` | Create new association |
| PUT | `/api/v1/project-tools/{id}/` | Update association |
| PATCH | `/api/v1/project-tools/{id}/` | Partial update association |
| DELETE | `/api/v1/project-tools/{id}/` | Delete association |

### FCC BDC

#### FCC Locations

**Model Fields:**
- `id` (integer): Unique identifier
- `fcc_location_id` (bigint): FCC location identifier
- `lat` (float): Latitude
- `long` (float): Longitude
- `state_name` (string): State name
- `county_name` (string, optional): County name
- `state_geoid` (bigint, optional): State GEOID
- `county_geoid` (bigint): County GEOID
- `geom` (point): Geographic point geometry

**Endpoints:**

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/fcc-query/bounding_box_query/` | Query locations within bounding box |

**Bounding Box Query Example:**
```http
POST /api/v1/fcc-query/bounding_box_query/
Content-Type: application/json
Authorization: Bearer {token}

{
  "state": "VA",
  "bbox": [-79.5, 37.9, -78.7, 38.3]
}
```

**Response:**
```json
{
  "results": [
    {
      "fcc_location_id": 123456789,
      "lat": 38.1234,
      "long": -78.9876,
      "state_name": "Virginia",
      "county_name": "Fairfax",
      "state_geoid": 51,
      "county_geoid": 51059
    }
  ]
}
```

## CRUD Operations Status

### Complete CRUD Operations ✅

The following components have full CRUD (Create, Read, Update, Delete) operations:

1. **Users** - Full CRUD via ViewSet
2. **Clients** - Full CRUD via ViewSet
3. **ClientProjects** - Full CRUD via ViewSet
4. **Projects** - Full CRUD via ViewSet
5. **Basemaps** - Full CRUD via ViewSet
6. **ProjectBasemaps** - Full CRUD via ViewSet
7. **LayerTypes** - Full CRUD via ViewSet
8. **ProjectLayerGroups** - Full CRUD via ViewSet
9. **ProjectLayers** - Full CRUD via ViewSet
10. **ProjectLayerData** (Features) - Full CRUD via ViewSet
11. **LayerPermissions** - Full CRUD via ViewSet
12. **CBRSLicenses** - Full CRUD via ViewSet
13. **MarkerLibrary** - Full CRUD via ViewSet
14. **PopupTemplates** - Full CRUD via ViewSet
15. **StyleLibrary** - Full CRUD via ViewSet
16. **ColorPalettes** - Full CRUD via ViewSet
17. **LayerFunctions** - Full CRUD via ViewSet
18. **ProjectLayerFunctions** - Full CRUD via ViewSet
19. **MapTools** - Full CRUD via ViewSet
20. **ProjectTools** - Full CRUD via ViewSet

### Read-Only Operations 📖

1. **AuditLogs** - Read-only (automatically generated)
2. **FCCLocations** - Query-only (bounding box queries)

## Missing CRUD Operations

### FCCLocations
Currently only has a bounding box query endpoint. Missing:
- GET /api/v1/fcc-locations/ (List all)
- GET /api/v1/fcc-locations/{id}/ (Get single)
- POST /api/v1/fcc-locations/ (Create)
- PUT /api/v1/fcc-locations/{id}/ (Update)
- DELETE /api/v1/fcc-locations/{id}/ (Delete)

**Note:** This may be intentional if FCC data is meant to be read-only from an external source.

## Common Query Parameters

Most list endpoints support the following query parameters:

### Pagination
- `page`: Page number (default: 1)
- `page_size`: Number of items per page (default: 20)

### Filtering
- `search`: Search text across searchable fields
- `ordering`: Field to order by (prefix with `-` for descending)

### Examples

**Paginated Request:**
```http
GET /api/v1/projects/?page=2&page_size=10
```

**Search and Order:**
```http
GET /api/v1/layers/?search=customer&ordering=-created_at
```

**Filter by Foreign Key:**
```http
GET /api/v1/layer-groups/?project_id=5
```

## Error Responses

All endpoints follow a consistent error response format:

**400 Bad Request:**
```json
{
  "error": "Invalid request",
  "details": {
    "field_name": ["Error message"]
  }
}
```

**401 Unauthorized:**
```json
{
  "detail": "Authentication credentials were not provided."
}
```

**403 Forbidden:**
```json
{
  "detail": "You do not have permission to perform this action."
}
```

**404 Not Found:**
```json
{
  "detail": "Not found."
}
```

**500 Internal Server Error:**
```json
{
  "error": "Internal server error",
  "message": "An unexpected error occurred"
}
```

## File Upload Process

The layer system supports file uploads for geographic data:

### 1. Initiate Upload
```http
POST /api/v1/upload/
Content-Type: multipart/form-data
Authorization: Bearer {token}

file: [binary file data]
layer_id: 5
crs: "EPSG:4326" (optional)
```

### 2. Complete Upload
```http
POST /api/v1/complete_upload/
Content-Type: application/json
Authorization: Bearer {token}

{
  "layer_id": 5,
  "crs": "EPSG:4326"
}
```

### Supported File Formats
- GeoJSON (.geojson, .json)
- Shapefile (.shp with accompanying files)
- KML/KMZ (.kml, .kmz)
- CSV with lat/lon columns (.csv)
- GeoPackage (.gpkg)

## Public Access

Projects can be made publicly accessible without authentication:

1. Set `is_public: true` on the project
2. System generates a `public_access_token`
3. Access via: `/api/v1/constructor/public/{public_access_token}/`

Public access is read-only and limited to:
- Project configuration
- Public layers
- Associated basemaps
- Layer data (if marked as public)

## Best Practices

### 1. Authentication
- Store tokens securely
- Refresh tokens before expiration
- Include token in all authenticated requests

### 2. Error Handling
- Check response status codes
- Parse error messages from response body
- Implement retry logic for network errors

### 3. Performance
- Use pagination for large datasets
- Use the optimized `/data-fast/` endpoints for layer data
- Implement caching where appropriate
- Use bounding box queries for geographic data

### 4. Data Integrity
- Validate data before submission
- Use transactions for related operations
- Check for unique constraints
- Handle foreign key relationships properly

### 5. Geographic Data
- Always specify CRS when uploading files
- Use EPSG:4326 (WGS84) as the standard
- Validate geometries before saving
- Use appropriate geometry types

## Admin Panel Recommendations

For the frontend admin panel, ensure the following features:

1. **User Management**
   - User CRUD with role assignment
   - Password reset functionality
   - Activity monitoring via audit logs

2. **Client Management**
   - Client CRUD operations
   - Client-Project associations
   - Access link generation

3. **Project Management**
   - Project CRUD with map preview
   - Layer group organization
   - Basemap configuration
   - Tool selection

4. **Layer Management**
   - Layer CRUD with file upload
   - Feature editing interface
   - Style configuration
   - Permission management

5. **Styling Components**
   - Marker library browser
   - Popup template editor
   - Style library manager
   - Color palette picker

6. **Function Configuration**
   - Function assignment to layers
   - Tool configuration per project
   - Priority and execution order

7. **Data Management**
   - Bulk import/export
   - CRS transformation
   - Data validation
   - CBRS license management

8. **Monitoring**
   - Audit log viewer
   - System health checks
   - Performance metrics
   - Error tracking