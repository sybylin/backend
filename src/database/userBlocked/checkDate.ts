export default (endDate: Date): boolean => {
	return (new Date().getTime()) < (new Date(endDate).getTime());
};
