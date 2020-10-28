## py2
import shelve
import pickle

destination = {}
source = shelve.open("source")
for key in source.keys():
    # key = key.decode("utf-8")
    value = source[key]
    print(key, value)
    destination[key] = value

pickle.dump(destination, open("destination.pkl", "wb"))
