# Utils Library

This library is made to be shared by all of the service.
It should handle things like database interface, shared stuff like 'make sure this is accessed by an connected user'

# How it is used

Painfully.

# Why no Docker ?

Docker compose can't make "build-only" docker images, where we just use them.
So we have to "build" the library in every Dockerfile for every service.
Well not really, dockers caches things for use,
meaning that while it seems that everybody builds it, it is only built once
