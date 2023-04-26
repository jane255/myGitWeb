from pathlib import Path
import os

project_dir = Path(__file__).parent.parent.parent
print(f"project_dir", project_dir)

templates_dir = f'{project_dir}/src/templates'
static_dir = f'{project_dir}/src/static'
repos_dir = f'{project_dir}/repos'

# print(f"project_dir", templates_dir, os.path.isdir(templates_dir))
# print(f"project_dir", static_dir, os.path.isdir(static_dir))
