# AI 2027 Prediction Tracker

This project is a React application built with Vite to track predictions from the AI 2027 scenario.

## Prerequisites

*   Node.js (v18 or higher recommended)
*   npm (usually comes with Node.js)

## Setup

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/<YOUR_GITHUB_USERNAME>/AI-2027-tracker.git
    cd AI-2027-tracker
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

## Available Scripts

*   **`npm run dev`**: Runs the app in development mode.
    Open [http://localhost:5173](http://localhost:5173) (or the port shown in your terminal) to view it in the browser.
    The page will reload if you make edits.

*   **`npm run build`**: Builds the app for production to the `dist` folder.
    It correctly bundles React in production mode and optimizes the build for the best performance.

*   **`npm run lint`**: Lints the project files.

*   **`npm run preview`**: Serves the production build locally for preview before deployment.

*   **`npm run deploy`**: Deploys the application to GitHub Pages.
    *   **Important:** Before running this for the first time:
        1.  Make sure you have pushed your local repository to GitHub.
        2.  Update the `homepage` field in your `package.json` to `https://<YOUR_GITHUB_USERNAME>.github.io/AI-2027-tracker` (replace `<YOUR_GITHUB_USERNAME>` and `AI-2027-tracker` if your repository name is different).
        3.  Ensure the `base` in `vite.config.js` matches your repository name (e.g., `/AI-2027-tracker/`).

## GitHub Pages Deployment

This project uses the `gh-pages` package to deploy the `dist` folder to the `gh-pages` branch on GitHub, which will then be served as your GitHub Pages site.

1.  After a successful `npm run build`, run `npm run deploy`.
2.  Go to your GitHub repository settings.
3.  Under the "Pages" section, ensure your site is being built from the `gh-pages` branch and the `/ (root)` directory.
4.  Your site should be live at the URL specified in your `package.json` (`homepage` field).

## Project Structure

*   `index.html`: The main HTML entry point.
*   `main.js`: The main JavaScript file where the React app is initialized and all components are defined.
*   `vite.config.js`: Vite configuration file.
*   `tailwind.config.js`: Tailwind CSS configuration.
*   `postcss.config.js`: PostCSS configuration.
*   `package.json`: Project metadata and dependencies.
*   `.gitignore`: Specifies intentionally untracked files that Git should ignore. 