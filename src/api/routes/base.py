from flask import Request


class RepoRequest:

    def __init__(self, request: Request):
        self.method = request.method
        self.request = request
        self.path = None
        self.repo_name = None
        self.service = None
        #
        self.parsed_path()

    def parsed_path(self):
        req = self.request
        self.path = req.path
        self.repo_name = self.path.split('/')[2]
        #
        path = self.path
        if 'info/refs' in path:
            self.service = req.args.get("service")
        if 'git-upload-pack' in path or "git-receive-pack" in path:
            self.service = path.split('/')[-1]

    def __repr__(self):
        """
        __repr__ 是一个魔法方法
        简单来说, 它的作用是得到类的 字符串表达 形式
        比如 print(u) 实际上是 print(u.__repr__())
        """
        classname = self.__class__.__name__
        properties = ['{}: ({})'.format(k, v) for k, v in self.__dict__.items()]
        s = '\n'.join(properties)
        return '< {}\n{} >\n'.format(classname, s)
