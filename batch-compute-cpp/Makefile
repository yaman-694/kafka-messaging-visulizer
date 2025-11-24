CXX := g++
CXXFLAGS := -std=c++11 -Wall
RDKAFKA_PATH := $(shell grep PACKAGE_FOLDER_RELEASE build/Release/generators/RdKafka-release-armv8-data.cmake | head -1 | cut -d'"' -f2)
LZ4_PATH := $(shell grep PACKAGE_FOLDER_RELEASE build/Release/generators/lz4-release-armv8-data.cmake | head -1 | cut -d'"' -f2)

all: path-finder

path-finder: main.cpp kafka.h
	$(CXX) $(CXXFLAGS) -I$(RDKAFKA_PATH)/include main.cpp -o path-finder -L$(RDKAFKA_PATH)/lib -L$(LZ4_PATH)/lib -lrdkafka++ -lrdkafka -llz4

clean:
	rm -f path-finder

.PHONY: all clean