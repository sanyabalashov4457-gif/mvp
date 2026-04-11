from chromadb import PersistentClient


def main() -> None:
    client = PersistentClient(path="db")
    collections = client.list_collections()
    collection_names = [item.name for item in collections]
    print("Collections:", collection_names)

    collection = client.get_collection("documents")
    print("Count:", collection.count())


if __name__ == "__main__":
    main()
