<?php
/*
Template Name: ReadingControls

Allow users to configure reading
*/
?>
<?php thr_header(false, '', true); ?>
<?php

// get the id if any
$ID = getGet('id', '', '/[0-9]+/');
?>
    <h2>Reading preferences</h2>
    <form action="<?php echo history(1) ?>" method="get" id="settingsForm">
        <table>
            <tr>
                <td>
                    <label for="voice">Voice</label>
                </td>
                <td>
                    <select name="voice" id="voice">
                        <?php THRoption("Silent", "silent", "voice") ?>
                        <?php THRoption("Child",  "child", "voice") ?>
                        <?php THRoption("Woman",  "woman", "voice") ?>
                        <?php THRoption("Man",    "man", "voice") ?>
                    </select>
                </td>
            </tr>
            <tr>
                <td>
                    <label for="pagecolor">Page Color</label>
                </td>
                <td>
                    <select name="pageColor" id="pageColor">
                        <?php THRoption("Black", "000", "pageColor") ?>
                        <?php THRoption("Blue", "00f", "pageColor") ?>
                        <?php THRoption("Cyan", "0ff", "pageColor") ?>
                        <?php THRoption("Green", "0f0", "pageColor") ?>
                        <?php THRoption("Magenta", "f0f", "pageColor") ?>
                        <?php THRoption("Red", "f00", "pageColor") ?>
                        <?php THRoption("White", "fff", "pageColor") ?>
                        <?php THRoption("Yellow", "ff0", "pageColor") ?>
                    </select>
                </td>
            <tr/>
            <tr>
                <td>
                    <label for="textColor">Text Color</label>
                </td>
                <td>
                    <select name="textColor" id="textColor">
                        <?php THRoption("Black", "000", "textColor") ?>
                        <?php THRoption("Blue", "00f", "textColor") ?>
                        <?php THRoption("Cyan", "0ff", "textColor") ?>
                        <?php THRoption("Green", "0f0", "textColor") ?>
                        <?php THRoption("Magenta", "ff0", "textColor") ?>
                        <?php THRoption("Red", "f00", "textColor") ?>
                        <?php THRoption("White", "fff", "textColor") ?>
                        <?php THRoption("Yellow", "ff0", "textColor") ?>
                    </select>
                </td>
            </tr>
        </table>
        <input type="submit" value="Done" />
    </form>

    <h2>This book</h2>
    <p>Download as: <a href="" >PowerPoint</a>, <a href="" >Impress</a>, or <a href="" >Flash</a>.</p>
<?php thr_footer(false, true); ?>
