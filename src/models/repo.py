from src.models import Model


class MyRepo(Model):
    """
    User 是一个保存用户数据的 model
    现在只有两个属性 username 和 password
    """

    def __init__(self, form: dict):
        self.id = form.get('id', None)
        self.repo_name = form.get('repo_name', '')
        self.user_id = form.get('user_id', '')
        self.description = form.get('description', '')
