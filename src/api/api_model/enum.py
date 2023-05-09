from enum import Enum


class EnumCheckoutType(Enum):
    """
    commit 类型:
    """
    branch = 'branch'
    tag = 'tag'
