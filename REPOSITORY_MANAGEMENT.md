# Repository Management Guide

## Overview

The Component Consistency Tracker now supports adding and comparing components from multiple local repositories. This allows you to analyze consistency across different component libraries, including comparing your own components with external libraries like Cloudflare's Stratus.

## Features Added

### 1. Repository Management
- **Add Local Repositories**: Add paths to local component libraries
- **Automatic Component Discovery**: Scans for React/TypeScript components
- **Component Parsing**: Extracts metadata, props, and documentation
- **Repository Information**: Displays component counts and last scan times

### 2. Component Comparison
- **Cross-Repository Analysis**: Compare components with the same name across repositories
- **Consistency Scoring**: Automatic scoring based on props, categories, and tags
- **Difference Detection**: Identifies inconsistencies and missing components
- **Visual Dashboard**: Tabbed interface for easy navigation

### 3. Enhanced Dashboard
- **Repository Filtering**: View components from specific repositories or all combined
- **Search Functionality**: Search across all repositories simultaneously
- **Component Cards**: Enhanced display with repository information

## How to Use

### Adding Repositories

1. **Open Repository Manager**
   - Click "Manage Repositories" button in the top-right corner
   - This opens the Repository Management dialog

2. **Add a New Repository**
   - Click "Add Repository" button
   - Enter the full path to your local repository (e.g., `/Users/username/projects/my-components`)
   - Optionally provide a custom name and description
   - Click "Add Repository"

3. **Scan for Components**
   - After adding, click the refresh icon next to the repository
   - This scans the repository for React/TypeScript component files
   - Component count will be updated after scanning

### Comparing Components

1. **Switch to Comparison Tab**
   - Click the "Comparison" tab in the main dashboard
   - This shows a detailed analysis of component consistency

2. **Review Consistency Scores**
   - **Green (80-100%)**: High consistency across repositories
   - **Yellow (60-79%)**: Some inconsistencies detected
   - **Red (0-59%)**: Significant differences or missing components

3. **Analyze Differences**
   - Expand component accordions to see detailed comparisons
   - Review which repositories have the component
   - Check identified issues and differences

### Example: Comparing with Stratus

To compare your components with Cloudflare's Stratus repository:

1. **Clone Stratus Repository** (if you have access)
   ```bash
   git clone git@gitlab.cfdata.org:cloudflare/fe/stratus.git
   ```

2. **Add to Tracker**
   - Use "Manage Repositories" to add the local Stratus path
   - Name it "Cloudflare Stratus" for clarity
   - Scan the repository to discover components

3. **Compare Components**
   - Switch to the Comparison tab
   - Look for components like Button, Card, Alert that exist in both repositories
   - Review consistency scores and differences

## Technical Implementation

### Browser Limitations

**Important Note**: The current implementation uses mock data for demonstration purposes because browsers cannot directly access the local file system. In a production environment, this would require:

1. **Backend Service**: A Node.js/Python service to scan local repositories
2. **File Upload**: Allow users to upload component files
3. **Git Integration**: Connect to Git repositories via API
4. **Desktop App**: Use Electron or similar for file system access

### Mock Data Behavior

The current implementation provides realistic mock data:
- Repositories with "stratus" or "cloudflare" in the name get Stratus-style components
- Other repositories get generic component examples
- Component parsing simulates real TypeScript/React analysis

### File Patterns Scanned

The scanner looks for components in these patterns:
- `**/components/**/*`
- `**/src/components/**/*`
- `**/lib/components/**/*`
- `**/packages/*/components/**/*`

Supported file extensions:
- `.tsx`, `.ts`, `.jsx`, `.js`, `.vue`, `.svelte`

## Component Analysis

### Metadata Extracted

For each component, the system extracts:
- **Name**: Primary component export name
- **Description**: From JSDoc comments
- **Props**: TypeScript interface definitions
- **Category**: Inferred from file path (Inputs, Surfaces, Feedback, etc.)
- **Tags**: Based on imports and file structure
- **Variants**: Different configurations of the same component

### Consistency Scoring Algorithm

The consistency score is calculated based on:
- **Category Matching** (25%): Same category across repositories
- **Tag Similarity** (25%): Common tags between components
- **Variant Count** (25%): Similar number of variants
- **Description Similarity** (25%): Text similarity in descriptions

### Difference Detection

The system identifies:
- **Missing Components**: Components that exist in some but not all repositories
- **Category Differences**: Same component in different categories
- **Variant Mismatches**: Different numbers of component variants
- **Tag Inconsistencies**: Different tagging approaches

## Best Practices

### Repository Organization

1. **Consistent Structure**: Use similar folder structures across repositories
2. **Clear Naming**: Use descriptive component and file names
3. **Documentation**: Include JSDoc comments for better analysis
4. **TypeScript**: Use TypeScript interfaces for better prop extraction

### Component Consistency

1. **Standardize Categories**: Use consistent categorization (Inputs, Surfaces, etc.)
2. **Common Tags**: Establish shared tagging conventions
3. **Prop Interfaces**: Use similar prop naming and types
4. **Variant Naming**: Consistent variant naming across repositories

### Regular Analysis

1. **Periodic Scans**: Regularly rescan repositories for updates
2. **Review Scores**: Monitor consistency scores over time
3. **Address Issues**: Prioritize fixing low-scoring components
4. **Team Alignment**: Share findings with design and development teams

## Future Enhancements

Potential improvements for a production version:

1. **Real File System Access**: Backend service or desktop app
2. **Git Integration**: Direct repository cloning and analysis
3. **Visual Diff**: Side-by-side component comparison
4. **Export Reports**: Generate consistency reports
5. **Automated Fixes**: Suggest or apply consistency improvements
6. **Team Collaboration**: Share analyses across team members
7. **CI/CD Integration**: Automated consistency checks in pipelines

## Troubleshooting

### Common Issues

1. **Repository Not Found**: Ensure the path exists and is accessible
2. **No Components Found**: Check that the repository contains React/TypeScript files
3. **Low Consistency Scores**: Review component implementations for alignment opportunities
4. **Missing Metadata**: Add JSDoc comments and TypeScript interfaces

### Getting Help

For questions or issues:
1. Check the browser console for error messages
2. Verify repository paths are correct
3. Ensure components follow expected patterns
4. Review the component analysis results for insights
