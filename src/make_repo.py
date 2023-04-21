import os

from git import Repo


def log(*args):
    print(*args, flush=True)


def make_repo(repo_name: str):
    repo_name += '.git'
    path = os.path.join('../repos', repo_name)
    if os.path.exists(path):
        log(f"仓库:({repo_name})已存在")
    else:
        bare_repo = Repo.init(path, bare=True)
        head = bare_repo.head.ref
        log(f"仓库:({repo_name}) 创建成功, 当前分支:{head}")


def main():
    repo_name = "haxi"
    make_repo(repo_name=repo_name)


if __name__ == '__main__':
    main()
