# Wikibase for Web

A browser extension that displays information from Wikidata and other Wikibase instances directly on web pages.

## Features

- Display Wikidata information related to web page content
- Support for custom Wikibase instances
- Extract structured data from web pages for Wikidata integration
- Perform minimal edits like updating item descriptions directly from the browser


## Data Mining Capabilities

The extension can extract structured data from various web pages, including:
- Bibliographic information from book pages
- Geographic coordinates from mapping sites
- Identifiers from various knowledge bases
- Structured data embedded in web page metadata

This information can be used to create or enhance Wikidata items with properly sourced references.

## Editing Capabilities

The extension allows users to make minimal edits to Wikidata directly from their browser:
- Update item descriptions
- Add identifiers with references
- Create new statements with proper sourcing
- Link web content to existing Wikidata items

## Multilingual Support

The extension is available in multiple languages:
- English (en)
- French (fr)
- German (de)
- Japanese (ja)
- Punjabi (pa)
- Portuguese (pt)
- Russian (ru)

Your language is missing? Please make a pull request.

## Installation

Install from [addons.mozilla.org.](https://addons.mozilla.org/en-US/firefox/addon/wikidata/) 

For development follow these steps:

### Prerequisites

- [Node.js](https://nodejs.org/) and npm
- [web-ext](https://github.com/mozilla/web-ext) (for testing)

### Setup

1. Clone the repository:
   ```
   git clone https://github.com/your-username/wikibase-for-web.git
   cd wikibase-for-web
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Run setup script to clone required repositories:
   ```
   npm run setup
   ```

## Testing

### Local Testing

1. Start the test server:
   ```
   npm run user-tests
   ```

2. Run the extension in Firefox:
   ```
   web-ext run --start-url http://127.0.0.1:8080/book_meta_tags.html --browser-console
   ```

## Development

### Scripts

- `npm run user-tests` - Start local test server
- `npm run setup` - Set up required dependencies
- `npm run check-translations` - Check translation files for completeness

## License

This project is licensed under the GNU License - see the [LICENSE](LICENSE) file for details.
