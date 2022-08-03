from setuptools import find_packages, setup

__version__ = "0.1"

setup(
    name='tiling',
    packages=find_packages(exclude=['tests', 'tests.*']),
    setup_requires=['wheel'],
    version=__version__,
    description='',
    author=''
)