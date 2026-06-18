import axios from 'axios';
import { router } from '@inertiajs/vue3';

window.axios = axios;
window.axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
window.axios.defaults.withCredentials = true;

router.on('error', (event) => {
    if (event.detail.page && event.detail.page.props.error) {
        console.error(event.detail.page.props.error);
    }
});
