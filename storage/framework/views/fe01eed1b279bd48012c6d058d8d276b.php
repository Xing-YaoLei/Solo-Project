<!DOCTYPE html>
<html lang="<?php echo e(str_replace('_', '-', app()->getLocale())); ?>">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title inertia><?php echo e(config('app.name', '二手车收购协同系统')); ?></title>
    <script src="https://cdn.tailwindcss.com"></script>
    @routes
    <?php echo app('Illuminate\Foundation\Vite')('resources/js/app.js'); ?>
    @inertiaHead
</head>
<body class="font-sans antialiased bg-gray-50">
    @inertia
</body>
</html>
<?php /**PATH /Users/yaoleyxing/Developer/solo-mange-pro/MP0321/resources/views/app.blade.php ENDPATH**/ ?>