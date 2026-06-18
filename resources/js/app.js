import './bootstrap';
import '../css/app.css';

import { createApp, h } from 'vue';
import { createInertiaApp, Link, router } from '@inertiajs/vue3';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { ZiggyVue } from '../../vendor/tightenco/ziggy/src/js/index.js';
import AppLayout from './Layouts/AppLayout.vue';
import Toast from './Components/Toast.vue';

window.router = router;

createInertiaApp({
    title: (title) => title ? `${title} - ${window.appName || '试驾预约协同台'}` : (window.appName || '试驾预约协同台'),
    resolve: async (name) => {
        const page = await resolvePageComponent(`./Pages/${name}.vue`, import.meta.glob('./Pages/**/*.vue'));
        page.default.layout = page.default.layout || ((pageComponent) => h(AppLayout, null, { default: () => pageComponent }));
        return page;
    },
    setup({ el, App, props, plugin }) {
        const ziggyConfig = (() => {
            if (typeof window.Ziggy !== 'undefined') return window.Ziggy;
            const shared = props?.initialPage?.props?.ziggy;
            if (shared) return shared;
            return null;
        })();

        const app = createApp({ render: () => h(App, props) })
            .use(plugin)
            .use(ZiggyVue, ziggyConfig)
            .component('InertiaLink', Link)
            .component('Toast', Toast)
            .mixin({
                methods: {
                    route: (name, params, absolute) => window.route(name, params, absolute),
                },
            });

        app.config.globalProperties.$filters = {
            currency(value, symbol = '¥') {
                if (value === null || value === undefined) return '-';
                return symbol + Number(value).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            },
            number(value, decimals = 0) {
                if (value === null || value === undefined) return '-';
                return Number(value).toLocaleString('zh-CN', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
            },
            date(value, format = 'YYYY-MM-DD') {
                if (!value) return '-';
                const d = new Date(value);
                if (isNaN(d.getTime())) return value;
                const map = {
                    YYYY: d.getFullYear(),
                    MM: String(d.getMonth() + 1).padStart(2, '0'),
                    DD: String(d.getDate()).padStart(2, '0'),
                    HH: String(d.getHours()).padStart(2, '0'),
                    mm: String(d.getMinutes()).padStart(2, '0'),
                    ss: String(d.getSeconds()).padStart(2, '0'),
                };
                return format.replace(/YYYY|MM|DD|HH|mm|ss/g, (m) => map[m]);
            },
            relative(value) {
                if (!value) return '-';
                const now = new Date();
                const d = new Date(value);
                const diffMs = now - d;
                const diffSec = Math.round(diffMs / 1000);
                const diffMin = Math.round(diffSec / 60);
                const diffHour = Math.round(diffMin / 60);
                const diffDay = Math.round(diffHour / 24);
                if (diffMs < 0) return `${Math.abs(diffDay)}天后`;
                if (diffSec < 60) return '刚刚';
                if (diffMin < 60) return `${diffMin}分钟前`;
                if (diffHour < 24) return `${diffHour}小时前`;
                if (diffDay < 30) return `${diffDay}天前`;
                return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            },
        };

        app.mount(el);
        return app;
    },
    progress: {
        color: '#4F46E5',
        showSpinner: true,
    },
});
