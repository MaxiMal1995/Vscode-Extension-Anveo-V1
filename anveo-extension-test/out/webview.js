"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.libHtmlContent = exports.createScriptHtmlContent = exports.getWebviewContent = void 0;
function getWebviewContent() {
    return `<!DOCTYPE html>
      <html>
          <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Webview Form</title>
              <style>
                  form {
                      width: 50%;
                      margin: 0 auto;
                  }
                  h1 {
                      text-align: center;
                  }
                  label {
                      font-weight: bold;
                      display: block;
                  }
                  input[type="text"], input[type="password"] {
                      width: 70%;
                      padding: 5px;
                      margin-bottom: 2px;
                      font-size: 10px;
                      border-radius: 2px;
                      border: 1px solid #ccc;
                  }
                  button {
                      padding: 10px 20px;
                      font-size: 16px;
                      background-color: #4CAF50;
                      color: white;
                      border: none;
                      border-radius: 5px;
                  }
              </style>
          </head>
          <body>
              <h1>Anveo Extension Login</h1>
              <form>
                  <label for="userName">Username:</label>
                  <input type="text" id="userName" name="userName" placeholder="playground"><br><br>
                  <label for="pass">Password:</label>
                  <input type="password" id="pass" name="pass"><br><br>
                  <label for="serverName">Server:</label>
                  <input type="text" id="serverName" name="serverName" placeholder="http://192.168.200.208:6248 "><br><br>
                  <label for="intanceName">Instance:</label>
                  <input type="text" id="instanceName" name="instanceName" placeholder="BC/NAV"><br><br>
              
                  <label for="companyName">Company:</label>
                  <input type="text" id="companyName" name="companyName" placeholder="CRONUS DE"><br><br>
                  <label for="tenantName">Tenant:</label>
                  <input type="text" id="tenantName" name="tenantName" placeholder="Default or Playground2"><br><br>
                  <button id="submit-button">Login</button>
              </form>
              <script>
              const vscode = acquireVsCodeApi();
              const submitButton = document.getElementById("submit-button");
                            submitButton.addEventListener("click", (event) => {
                                event.preventDefault();
                                const username = document.getElementById("userName").value;
                                const password = document.getElementById("pass").value;
                                const server = document.getElementById("serverName").value;
                                const instance = document.getElementById("instanceName").value;
                                const company = document.getElementById("companyName").value;
                                const tenant = document.getElementById("tenantName").value;
                                vscode.postMessage({
                                    command: "submit",
                                    data: {
                                        username,
                                        password,
                                        server,
                                        instance,
                                        company,
                                        tenant
                                       }
                                });
                            });
              </script>
          </body>
      </html>
    `;
}
exports.getWebviewContent = getWebviewContent;
;
function createScriptHtmlContent() {
    return `
    <html>
      <head>
        <style>
        form {
            margin: 0 auto;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol';
            font-size: 16px;
            line-height: 1.5;
            color: #24292e;
            background-color: #f6f8fa;
            position: center;
          }
          
          h1 {
            margin-top: 0;
            margin-bottom: 16px;
            font-size: 24px;
            font-weight: 600;
            text-align: center;
          }
          
          label {
            display: block;
            margin-bottom: 8px;
            font-weight: 600;
          }
          
          input[type="text"],
          textarea {
            display: block;
            width: 30%;
            padding: 8px 12px;
            font-size: 16px;
            line-height: 1.5;
            color: #24292e;
            background-color: #fff;
            background-image: none;
            border: 1px solid #d1d5da;
            border-radius: 6px;
            box-shadow: inset 0 1px 2px rgba(27,31,35,0.075);
            transition: border-color 0.15s ease-in-out,box-shadow 0.15s ease-in-out; }
          
          input[type="text"]:focus,
          textarea:focus {
            outline: none;
            border-color: #0366d6;
            box-shadow: inset 0 1px 2px rgba(27,31,35,0.075), 0 0 0 3px rgba(3,102,214,0.3); }
          
          select {
            display: block;
            width: 30%;
            height: calc(2.25rem + 2px);
            padding: 0.375rem 0.75rem;
            font-size: 1rem;
            font-weight: 400;
            line-height: 1.5;
            color: #24292e;
            background-color: #fff;
            background-clip: padding-box;
            border: 1px solid #d1d5da;
            border-radius: 6px;
            transition: border-color 0.15s ease-in-out,box-shadow 0.15s ease-in-out; }
          
          select:focus {
            outline: none;
            border-color: #0366d6;
            box-shadow: 0 0 0 3px rgba(3,102,214,0.3); }
          
          button[type="submit"] {
            display: block;
            width: 10%;
            height: calc(2.25rem + 2px);
            padding: 0.375rem 0.75rem;
            font-size: 1rem;
            font-weight: 600;
            line-height: 1.5;
            color: #fff;
            background-color: #28a745;
            border: 1px solid #28a745;
            border-radius: 6px;
            cursor: pointer;
            transition: background-color 0.15s ease-in-out,border-color 0.15s ease-in-out; }
          
          button[type="submit"]:hover,
          button[type="submit"]:focus {
            background-color: #218838;
            border-color: #1e7e34;
          }
          
          button[type="submit"]:focus {
            outline: none;
            box-shadow: 0 0 0 3px rgba(40, 167, 69, 0.5);
         }
          
        </style>
      </head>
      <body>
        <h1>Create New Script</h1>
        <form id="form">
          <label for="script-name">Script Name</label>
          <input type="text" id="script-name" required>

          <label for="description">Description</label>
          <textarea id="description" required></textarea>

          <label for="version">Version</label>
          <input type="text" id="version" required>

          <label for="script-type">Script Type</label>
          <select id="script-type">
            <option value="script">Script</option>
            <option value="script-library">Script Library</option>
            <option value="javascript">JavaScript</option>
          </select>
          <button id="submit-button">Create</button>
        </form>

        <script>
          const vscode = acquireVsCodeApi();

          const submitButton = document.getElementById("submit-button");
          submitButton.addEventListener("click", (event) => {
            event.preventDefault();
            
            const scriptName = document.getElementById('script-name').value;
            const description = document.getElementById('description').value;
            const version = document.getElementById('version').value;
            const scriptType = document.getElementById('script-type').value;

            vscode.postMessage({
              command: "createScript",
              data: {
              scriptName,
              description,
              version,
              scriptType
            }
            });
          });
        </script>
      </body>
    </html>
  `;
}
exports.createScriptHtmlContent = createScriptHtmlContent;
;
function libHtmlContent(nonce, activeFileName) {
    return `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'nonce-${nonce}'; img-src vscode-resource: https: data:; media-src vscode-resource:;">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Library Names</title>
  </head>
  <body>
    <label for="filename">File Name:</label>
    <input type="text" id="filename" value="${activeFileName}">
    <button id="showLibraries">Show Libraries</button>
    <ul id="library-names"></ul>
    <script nonce="${nonce}">
      const vscode = acquireVsCodeApi();
      const button = document.getElementById('showLibraries');
      button.addEventListener('click', () => {
        const fileName = document.getElementById('filename').value;
        vscode.postMessage({ type: 'getLibraryNames', fileName: fileName });
      });
      window.addEventListener('message', event => {
        const message = event.data;
        if (message.type === 'libraryNames') {
          const libraryNames = message.libraryNames;
          const libraryNamesList = document.getElementById('library-names');
          libraryNamesList.innerHTML = '';
          libraryNames.forEach(libraryName => {
            const li = document.createElement('li');
            li.textContent = libraryName;
            libraryNamesList.appendChild(li);
          });
        }
      });
    </script>
  </body>
</html>
`;
}
exports.libHtmlContent = libHtmlContent;
;
//# sourceMappingURL=webview.js.map