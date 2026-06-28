import os, re, shutil, subprocess
from pathlib import Path
from langchain_text_splitters import RecursiveCharacterTextSplitter
from config import IGNORED_DIRS, ALLOWED_EXTENSIONS, EXTENSION_TO_LANG

def collection_name_from_url(repo_url: str):
    name = repo_url.rstrip('/').split('/')[-1]
    name = re.sub(r"[^a-zA-Z0-9_-]", '_', name)
    return name[:50]

def clone_repo(repo_url: str, target_dir: str):
    if os.path.exists(target_dir):
        shutil.rmtree(target_dir)
    subprocess.run(["git", "clone", "--depth", "1", repo_url, target_dir],
                   check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=120)

def path_and_filter_repo(base_dir: str):
    valid_files = []
    for root, dirs, files in os.walk(base_dir):
        dirs[:] = [d for d in dirs if d not in IGNORED_DIRS]
        for file in files:
            fp = Path(root) / file
            if fp.suffix.lower() in ALLOWED_EXTENSIONS:
                valid_files.append(fp)
    return valid_files

def split_file(file_path: Path, content: str):
    ext = file_path.suffix.lower()
    if ext in EXTENSION_TO_LANG:
        splitter = RecursiveCharacterTextSplitter.from_language(
            EXTENSION_TO_LANG[ext], chunk_size=600, chunk_overlap=80)
    else:
        splitter = RecursiveCharacterTextSplitter(
            chunk_size=600, chunk_overlap=80, separators=['\n\n', '\n', ' ', ''])
    return splitter.create_documents([content])

def build_chunk(file_paths: list):
    all_chunks = []
    for fp in file_paths:
        try:
            content = fp.read_text(encoding='utf-8')
            for chunk in split_file(fp, content):
                chunk.metadata['source_file'] = str(fp)
                chunk.page_content = f'# File: {fp}\n{chunk.page_content}'
                all_chunks.append(chunk)
        except Exception as e:
            print(f"Failed to process {fp}: {e}")
    return all_chunks