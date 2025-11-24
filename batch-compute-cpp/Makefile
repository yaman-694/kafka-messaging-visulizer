CXX=g++
CXXFLAGS=-std=c++11 -Wall -I./build/Release/generators
LDFLAGS=-L./build/Release/generators
LDLIBS=-lrdkafka++

all: path-finder

path-finder: main.cpp kafka.h
	$(CXX) $(CXXFLAGS) main.cpp -o path-finder $(LDFLAGS) $(LDLIBS)

clean:
	rm -f path-finder

.PHONY: all clean