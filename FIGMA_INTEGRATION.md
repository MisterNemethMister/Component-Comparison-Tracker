# 🎨 Figma Integration Guide

## Overview

The Component Consistency Tracker now supports Figma files as component repositories! This allows you to compare your design components in Figma with your code implementations.

## Setup Instructions

### 1. Get Your Figma API Token

1. Go to [Figma Account Settings](https://www.figma.com/settings)
2. Scroll to **Personal access tokens**
3. Click **Generate new token**
4. Give it a descriptive name (e.g., "Component Tracker")
5. Copy the token (starts with `figd_`)

⚠️ **Important**: Save your token securely - you won't be able to see it again!

### 2. Configure the Token in the App

1. Open the Component Consistency Tracker
2. Click **Manage Repositories**
3. Click **Add Repository**
4. Switch to the **Figma File** tab
5. Click **Configure API Token**
6. Paste your token and click **Save Token**

Your token is stored locally in your browser's localStorage.

### 3. Add a Figma File

1. In the **Add Repository** form, select **Figma File** tab
2. Paste your Figma file URL (e.g., `https://www.figma.com/design/ABC123/...`)
3. Optionally add a custom name and description
4. Click **Add Repository**

### 4. Scan for Components

1. Once added, click the **Refresh** icon next to your Figma repository
2. The scanner will:
   - Extract all components and component sets from your Figma file
   - Generate thumbnails for each component
   - Parse variants and properties
   - Categorize components automatically

## Features

### Component Extraction

The integration extracts:
- **Component names** - Base component names
- **Variants** - All variants within component sets
- **Properties** - Component property definitions from Figma
- **Descriptions** - Component descriptions from Figma
- **Thumbnails** - Visual previews of each component (2x scale)
- **Categories** - Auto-categorized (Button, Input, Card, etc.)
- **Tags** - Auto-generated from component names

### Automatic Categorization

Components are automatically categorized based on their names:
- Buttons → "Button"
- Inputs/Fields → "Input"
- Cards → "Card"
- Modals/Dialogs → "Modal"
- Navigation/Menus → "Navigation"
- Tables → "Table"
- Icons → "Icon"
- Badges/Chips → "Badge"
- Alerts/Toasts → "Alert"
- Everything else → "Other"

### Comparison with Code

Once scanned, Figma components appear alongside your code repositories:
- Compare component names across Figma and code
- Identify missing implementations
- View visual differences
- Track consistency scores

## Example: Your Figma File

Your Shared Components Library:
```
https://www.figma.com/design/GpmgtXiiTbCxfFSDWsxJ95/Shared-Components-Library?m=auto&node-id=17414-76454&t=KVtl8yH8lnSjCoFE-1
```

**Steps to add:**
1. Configure your Figma API token (one-time setup)
2. Click "Add Repository" → "Figma File" tab
3. Paste the URL above
4. Name it "Shared Components Library"
5. Click "Add Repository"
6. Click the refresh icon to scan

## Troubleshooting

### "Invalid Figma API token"
- Verify your token is correct
- Check that the token hasn't expired
- Ensure you have access to the Figma file

### "Failed to fetch Figma file"
- Verify the URL is correct
- Check that the file is accessible with your account
- Ensure the file isn't private/restricted

### No components found
- Verify the file contains Figma components (not just frames)
- Check that components are published or marked as components
- Try a different page in the file

### Missing thumbnails
- Thumbnails are generated asynchronously by Figma
- Try scanning again after a few moments
- Check your API rate limits

## API Rate Limits

Figma's API has rate limits:
- **Personal tokens**: 1000 requests per minute
- Be mindful when scanning large files

## Privacy & Security

- Your Figma API token is stored locally in your browser
- No tokens are sent to any external servers
- All Figma API calls are made directly from your browser to Figma
- Clear your token anytime via "Configure API Token" → "Clear Saved Token"

## Next Steps

After adding your Figma repository:
1. Scan your code repositories
2. Use the **Comparison** tab to see consistency analysis
3. Identify components that exist in Figma but not in code
4. Track implementation progress
5. Maintain design-code consistency

## Learn More

- [Figma API Documentation](https://www.figma.com/developers/api)
- [Figma Component Documentation](https://help.figma.com/hc/en-us/articles/360038662654-Guide-to-components-in-Figma)
