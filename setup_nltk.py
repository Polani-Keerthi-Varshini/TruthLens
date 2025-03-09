import nltk

def download_nltk_data():
    """Download required NLTK data packages."""
    required_packages = [
        'punkt',
        'averaged_perceptron_tagger',
        'maxent_ne_chunker',
        'words'
    ]
    
    for package in required_packages:
        try:
            nltk.download(package)
        except Exception as e:
            print(f"Error downloading {package}: {str(e)}")

if __name__ == "__main__":
    download_nltk_data()
