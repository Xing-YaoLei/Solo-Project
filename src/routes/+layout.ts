import '../app.css';
import type { LayoutLoad } from './$types';

export const load: LayoutLoad = async () => {
	return {
		title: '青少年培训作业批改风险监测系统'
	};
};

export const ssr = true;
