ALL: path-finder

CXX=g++
CXXFLAGS=-Wall -std=c++17
LIBS=-lcurl -ljsoncpp

path-finder: path-finder.cpp
	$(CXX) $(CXXFLAGS) -o path-finder path-finder.cpp $(LIBS)

clean:
	rm -f path-finder

.PHONY: ALL clean