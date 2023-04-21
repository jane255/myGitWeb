from server import app


def main():
    # 运行一个 websocket 程序的套路
    config = dict(
        debug=True,
        host='0.0.0.0',
        port=5000,
    )
    app.run(**config)


if __name__ == '__main__':
    main()
