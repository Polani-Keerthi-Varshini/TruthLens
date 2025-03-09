import os
import zipfile
from pathlib import Path

def create_extension_zip():
    """Create a ZIP file of the browser extension for distribution."""
    # Define which files to include
    include_files = [
        'manifest.json',
        'popup.html',
        'popup.js',
        'background.js',
        'content.js',
        'icons/icon16.png',
        'icons/icon48.png',
        'icons/icon128.png'
    ]
    
    # Create ZIP file
    zip_path = 'truthlens_extension.zip'
    with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for file_path in include_files:
            if os.path.exists(file_path):
                zipf.write(file_path)
            else:
                print(f"Warning: {file_path} not found")
    
    print(f"\nExtension packaged successfully: {zip_path}")
    print("You can now distribute this ZIP file to users for installation.")

if __name__ == "__main__":
    create_extension_zip()
