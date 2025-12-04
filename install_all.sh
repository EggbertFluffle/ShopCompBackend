cd lib
DIRS=$(ls)

for d in $DIRS;
do
	cd $d && npm i && cd ../
done

