import sys
import json
import os
from PyQt6.QtWidgets import (
    QApplication, QMainWindow, QWidget, QVBoxLayout, QHBoxLayout,
    QTabWidget, QListWidget, QLineEdit, QTextEdit, QPushButton,
    QLabel, QFormLayout, QMessageBox, QSplitter, QScrollArea
)
from PyQt6.QtCore import Qt, QSize
from PyQt6.QtWebEngineWidgets import QWebEngineView
from PyQt6.QtWebEngineCore import QWebEngineSettings
from PyQt6.QtGui import QFont, QColor, QPalette, QIcon

import markdown

# Define paths (assuming script is in project root)
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PREDICTIONS_FILE = os.path.join(SCRIPT_DIR, 'src', 'data', 'predictions.json')
BLOG_POSTS_FILE = os.path.join(SCRIPT_DIR, 'src', 'data', 'blogPosts.json')

# Colors from the web app (approximate)
COLOR_BACKGROUND = "#F8F5F2"
COLOR_TEXT_PRIMARY = "#4A4441"
COLOR_ACCENT_GREEN = "#059669"
COLOR_CARD_BACKGROUND = "#FFFFFF"
COLOR_BORDER_MUTED = "#D1D5DB"
COLOR_TEXT_SECONDARY = "#7d746f"

STYLESHEET = f"""
    QMainWindow, QTabWidget::pane {{
        background-color: {COLOR_BACKGROUND};
    }}
    QWidget {{
        color: {COLOR_TEXT_PRIMARY};
        font-size: 10pt; /* Base font size for the app */
    }}
    QLabel {{
        color: {COLOR_TEXT_PRIMARY}; /* Ensure all labels get this by default */
        padding-top: 3px; /* Add some top padding to form labels */
        padding-bottom: 3px;
    }}
    QLabel#HeaderLabel {{
        font-size: 18px;
        font-weight: bold;
        color: #FEFEFE; /* Light white/off-white for main headers */
        padding-bottom: 10px;
        padding-top: 5px;
    }}
    QLabel#SubHeaderLabel {{
        font-size: 11pt;
        font-weight: bold;
        color: #E5E7EB; /* Lighter grey for sub-headers */
        margin-top: 10px;
        margin-bottom: 4px;
    }}
    QListWidget {{
        background-color: {COLOR_CARD_BACKGROUND};
        border: 1px solid {COLOR_BORDER_MUTED};
        border-radius: 5px;
        font-size: 10pt; /* Adjusted for consistency */
    }}
    QListWidget::item:selected {{
        background-color: {COLOR_ACCENT_GREEN};
        color: white;
    }}
    QLineEdit, QTextEdit {{
        background-color: white;
        border: 1px solid {COLOR_BORDER_MUTED};
        border-radius: 3px;
        padding: 5px;
        font-size: 10pt;
        color: {COLOR_TEXT_PRIMARY};
    }}
    QTextEdit#MarkdownInput {{
        font-family: "Courier New", monospace; 
    }}
    QPushButton {{
        background-color: {COLOR_ACCENT_GREEN};
        color: white;
        font-weight: bold;
        border-radius: 5px;
        padding: 8px 15px;
        font-size: 10pt;
    }}
    QPushButton:hover {{
        background-color: #047857; 
    }}
    QPushButton#NewButton {{
        background-color: #3B82F6; /* A blue color for New button */
    }}
    QPushButton#NewButton:hover {{
        background-color: #2563EB; /* Darker blue */
    }}
    QTabWidget::tab-bar {{
        alignment: left;
    }}
    QTabBar::tab {{
        background: #E5E7EB; 
        color: {COLOR_TEXT_PRIMARY};
        border: 1px solid {COLOR_BORDER_MUTED};
        border-bottom: none;
        border-top-left-radius: 4px;
        border-top-right-radius: 4px;
        padding: 8px 15px;
        margin-right: 2px;
        font-size: 10pt;
    }}
    QTabBar::tab:selected {{
        background: {COLOR_CARD_BACKGROUND};
        color: {COLOR_ACCENT_GREEN};
        font-weight: bold;
        border-color: {COLOR_BORDER_MUTED};
    }}
    QScrollArea {{
        border: none;
    }}
    QSplitter::handle {{
        background-color: {COLOR_BACKGROUND}; /* Make splitter handles less obtrusive */
    }}
    QSplitter::handle:horizontal {{
        width: 1px;
        margin: 2px 0;
    }}
    QSplitter::handle:vertical {{
        height: 1px;
        margin: 0 2px;
    }}
"""

class MarkdownPreview(QWebEngineView):
    def __init__(self, parent=None):
        super().__init__(parent)
        self.settings().setAttribute(QWebEngineSettings.WebAttribute.ScrollAnimatorEnabled, True)
        self.settings().setAttribute(QWebEngineSettings.WebAttribute.JavascriptEnabled, False) # For security
        self.settings().setAttribute(QWebEngineSettings.WebAttribute.LocalContentCanAccessRemoteUrls, False)
        self.page().setBackgroundColor(QColor(COLOR_CARD_BACKGROUND))


    def set_markdown_content(self, md_text):
        html_base = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                body {{
                    font-family: sans-serif;
                    line-height: 1.6;
                    background-color: {COLOR_CARD_BACKGROUND};
                    color: {COLOR_TEXT_PRIMARY};
                    padding: 15px;
                }}
                h1, h2, h3, h4, h5, h6 {{
                    color: {COLOR_TEXT_PRIMARY};
                    font-family: Georgia, Times, serif; /* Matching web app's serif headers */
                }}
                h1 {{ font-size: 2em; }}
                h2 {{ font-size: 1.75em; }}
                h3 {{ font-size: 1.5em; }}
                code {{
                    background-color: #f0f0f0;
                    padding: 2px 4px;
                    border-radius: 3px;
                    font-family: "Courier New", monospace;
                }}
                pre {{
                    background-color: #f0f0f0;
                    padding: 10px;
                    border-radius: 3px;
                    overflow-x: auto;
                }}
                table {{
                    border-collapse: collapse;
                    width: 100%;
                    margin-bottom: 1em;
                }}
                th, td {{
                    border: 1px solid {COLOR_BORDER_MUTED};
                    padding: 8px;
                    text-align: left;
                }}
                th {{
                    background-color: #f2f2f2;
                }}
                blockquote {{
                    border-left: 4px solid {COLOR_ACCENT_GREEN};
                    padding-left: 10px;
                    color: {COLOR_TEXT_SECONDARY};
                    margin-left: 0;
                }}
                a {{
                    color: {COLOR_ACCENT_GREEN};
                    text-decoration: none;
                }}
                a:hover {{
                    text-decoration: underline;
                }}
            </style>
        </head>
        <body>
            {{{{content}}}}
        </body>
        </html>
        """
        html_content = markdown.markdown(md_text, extensions=['fenced_code', 'tables', 'sane_lists'])
        self.setHtml(html_base.replace("{{content}}", html_content))

class EditorWindow(QMainWindow):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("AI 2027 Content Editor")
        self.setGeometry(100, 100, 1300, 850) # Slightly larger default
        self.setStyleSheet(STYLESHEET)

        self.predictions_data = []
        self.blog_posts_data = []
        self.current_blog_is_new = False # Flag for new blog post

        self.main_widget = QWidget()
        self.setCentralWidget(self.main_widget)
        self.main_layout = QVBoxLayout(self.main_widget)

        self.tabs = QTabWidget()
        self.main_layout.addWidget(self.tabs)

        # Predictions Tab
        self.predictions_tab = QWidget()
        self.tabs.addTab(self.predictions_tab, "Predictions")
        self.setup_predictions_ui()

        # Blog Posts Tab
        self.blog_tab = QWidget()
        self.tabs.addTab(self.blog_tab, "Blog Posts")
        self.setup_blog_ui()

        self.load_all_data()
        self.update_font_sizes()


    def update_font_sizes(self):
        # Base font set in stylesheet for QWidget, specific adjustments elsewhere if needed
        pass

    def create_form_layout_from_dict(self, data_dict, parent_layout, excluded_keys=None):
        if excluded_keys is None:
            excluded_keys = []
        
        form_layout = QFormLayout()
        form_layout.setRowWrapPolicy(QFormLayout.RowWrapPolicy.WrapAllRows) 
        form_layout.setLabelAlignment(Qt.AlignmentFlag.AlignLeft) 
        widgets = {}

        for key, value in data_dict.items():
            if key in excluded_keys:
                continue
            
            # Use the key directly, capitalized, for the label
            label_text = key[0].upper() + key[1:] 
            label = QLabel(f"{{label_text}}:")
            
            use_text_edit = False
            if isinstance(value, str):
                if '\n' in value or len(value) > 70: # Adjust threshold for multi-line
                    use_text_edit = True
            elif isinstance(value, list):
                use_text_edit = True
            
            if use_text_edit:
                current_value_str = json.dumps(value, indent=2) if isinstance(value, list) else str(value)
                widget = QTextEdit(current_value_str)
                widget.setMinimumHeight(60) 
                widget.setMaximumHeight(150)
            else:
                widget = QLineEdit(str(value if value is not None else ""))
            
            form_layout.addRow(label, widget)
            widgets[key] = widget
        
        scroll_widget_content = QWidget()
        scroll_widget_content.setLayout(form_layout)

        scroll_area = QScrollArea()
        scroll_area.setWidget(scroll_widget_content)
        scroll_area.setWidgetResizable(True)
        
        parent_layout.addWidget(scroll_area)
        return widgets

    def setup_predictions_ui(self):
        layout = QHBoxLayout(self.predictions_tab)
        splitter = QSplitter(Qt.Orientation.Horizontal)

        # Left side: List of predictions
        left_panel = QWidget()
        left_layout = QVBoxLayout(left_panel)
        header_label = QLabel("Predictions")
        header_label.setObjectName("HeaderLabel")
        left_layout.addWidget(header_label)
        self.predictions_list_widget = QListWidget()
        self.predictions_list_widget.itemClicked.connect(self.display_prediction_details)
        left_layout.addWidget(self.predictions_list_widget)
        splitter.addWidget(left_panel)

        # Right side: Editor fields
        self.right_prediction_panel_content = QWidget() # Content widget for editor + button
        self.predictions_editor_area_layout = QVBoxLayout() # Layout for just the dynamic form fields
        
        self.right_prediction_panel_layout = QVBoxLayout(self.right_prediction_panel_content)
        self.right_prediction_panel_layout.addLayout(self.predictions_editor_area_layout) # Add the dedicated form layout here

        self.prediction_fields_widgets = {}
        
        self.save_prediction_button = QPushButton("Save Prediction")
        self.save_prediction_button.clicked.connect(self.save_current_prediction)
        self.save_prediction_button.setFixedHeight(40)
        
        button_h_layout = QHBoxLayout()
        button_h_layout.addStretch()
        button_h_layout.addWidget(self.save_prediction_button)
        button_h_layout.addStretch()
        self.right_prediction_panel_layout.addLayout(button_h_layout) # Add button layout to the main right panel layout
        
        splitter.addWidget(self.right_prediction_panel_content)
        layout.addWidget(splitter)
        splitter.setSizes([300, 700])

    def setup_blog_ui(self):
        layout = QHBoxLayout(self.blog_tab)
        splitter_main = QSplitter(Qt.Orientation.Horizontal)

        # Left side: List of blog posts + New Blog Post Button
        left_panel = QWidget()
        left_layout = QVBoxLayout(left_panel)
        header_label = QLabel("Blog Posts")
        header_label.setObjectName("HeaderLabel")
        left_layout.addWidget(header_label)
        
        self.blog_list_widget = QListWidget()
        self.blog_list_widget.itemClicked.connect(self.display_blog_details)
        left_layout.addWidget(self.blog_list_widget)

        new_blog_button = QPushButton("New Blog Post")
        new_blog_button.setObjectName("NewButton")
        new_blog_button.clicked.connect(self.prepare_new_blog_post)
        left_layout.addWidget(new_blog_button)
        
        splitter_main.addWidget(left_panel)

        # Right side: Editor (Metadata + Markdown Editor + Preview)
        right_panel_container = QWidget()
        self.right_blog_panel_layout = QVBoxLayout(right_panel_container) # Main layout for the right side
        
        # Metadata Section
        self.blog_metadata_editor_area_layout = QVBoxLayout() # Dedicated layout for dynamic metadata form
        self.blog_fields_widgets = {}
        self.right_blog_panel_layout.addLayout(self.blog_metadata_editor_area_layout) # Add to main right layout

        # Markdown Editor and Preview (in a vertical splitter)
        editor_splitter = QSplitter(Qt.Orientation.Vertical)

        markdown_input_group = QWidget()
        markdown_input_layout = QVBoxLayout(markdown_input_group)
        markdown_label = QLabel("Markdown Content:")
        markdown_label.setObjectName("SubHeaderLabel")
        self.blog_content_edit = QTextEdit()
        self.blog_content_edit.setObjectName("MarkdownInput")
        self.blog_content_edit.textChanged.connect(self.update_markdown_preview)
        markdown_input_layout.addWidget(markdown_label)
        markdown_input_layout.addWidget(self.blog_content_edit)
        editor_splitter.addWidget(markdown_input_group)
        
        markdown_preview_group = QWidget()
        markdown_preview_layout = QVBoxLayout(markdown_preview_group)
        preview_label = QLabel("Live Preview:")
        preview_label.setObjectName("SubHeaderLabel")
        self.markdown_preview = MarkdownPreview()
        markdown_preview_layout.addWidget(preview_label)
        markdown_preview_layout.addWidget(self.markdown_preview)
        editor_splitter.addWidget(markdown_preview_group)

        self.right_blog_panel_layout.addWidget(editor_splitter) # Add splitter to main right layout

        self.save_blog_button = QPushButton("Save Blog Post")
        self.save_blog_button.clicked.connect(self.save_current_blog_post)
        self.save_blog_button.setFixedHeight(40)
        self.right_blog_panel_layout.addWidget(self.save_blog_button, alignment=Qt.AlignmentFlag.AlignRight)

        splitter_main.addWidget(right_panel_container)
        layout.addWidget(splitter_main)
        splitter_main.setSizes([300, 700])
        editor_splitter.setSizes([400,400])


    def load_all_data(self):
        try:
            with open(PREDICTIONS_FILE, 'r', encoding='utf-8') as f:
                self.predictions_data = json.load(f)
            self.predictions_list_widget.clear()
            for pred in self.predictions_data:
                self.predictions_list_widget.addItem(f"{{pred.get('id', 'N/A')}}: {{pred.get('text', 'No Text')[:50]}}...")
        except Exception as e:
            QMessageBox.critical(self, "Error Loading Predictions", f"Could not load {{PREDICTIONS_FILE}}:\n{{e}}")

        try:
            with open(BLOG_POSTS_FILE, 'r', encoding='utf-8') as f:
                self.blog_posts_data = json.load(f)
            self.blog_list_widget.clear()
            for post in self.blog_posts_data:
                self.blog_list_widget.addItem(f"{{post.get('id', 'N/A')}}: {{post.get('title', 'No Title')}}")
        except Exception as e:
            QMessageBox.critical(self, "Error Loading Blog Posts", f"Could not load {{BLOG_POSTS_FILE}}:\n{{e}}")
            
    def _clear_layout(self, layout):
        if layout is not None:
            while layout.count():
                item = layout.takeAt(0)
                widget = item.widget()
                if widget is not None:
                    widget.deleteLater()
                else:
                    # If it's a layout item, recursively clear it
                    sub_layout = item.layout()
                    if sub_layout is not None:
                        self._clear_layout(sub_layout)
                    # Remove the layout item itself from its parent
                    # This part is tricky as QLayout doesn't directly own QLayoutItems in a way that easy to remove all at once
                    # The common approach is to delete widgets and rely on Qt's cleanup
                    # For layouts themselves, if they are added to another layout, removing their parent widget or clearing the parent layout
                    # handles it. For dynamic QFormLayouts being replaced, deleting the old ScrollArea widget is key.

    def display_prediction_details(self, item):
        index = self.predictions_list_widget.row(item)
        if 0 <= index < len(self.predictions_data):
            prediction = self.predictions_data[index]
            
            # Clear previous editor widgets by removing the old scroll area
            # Find and remove the old scroll area if it exists
            for i in reversed(range(self.predictions_editor_area_layout.count())):
                widget_item = self.predictions_editor_area_layout.itemAt(i).widget()
                if isinstance(widget_item, QScrollArea):
                    widget_item.deleteLater()
                    break # Assuming only one scroll area for fields
            self.prediction_fields_widgets.clear()

            self.prediction_fields_widgets = self.create_form_layout_from_dict(
                prediction, 
                self.predictions_editor_area_layout, # Pass the dedicated layout for the form
                excluded_keys=[] 
            )
            
    def display_blog_details(self, item):
        self.current_blog_is_new = False # Editing an existing post
        index = self.blog_list_widget.row(item)
        if 0 <= index < len(self.blog_posts_data):
            post = self.blog_posts_data[index]

            for i in reversed(range(self.blog_metadata_editor_area_layout.count())):
                widget_item = self.blog_metadata_editor_area_layout.itemAt(i).widget()
                if isinstance(widget_item, QScrollArea):
                    widget_item.deleteLater()
                    break
            self.blog_fields_widgets.clear()

            self.blog_fields_widgets = self.create_form_layout_from_dict(
                post, 
                self.blog_metadata_editor_area_layout, # Pass dedicated layout
                excluded_keys=['content']
            )
            self.blog_content_edit.setText(post.get('content', ''))

    def update_markdown_preview(self):
        md_text = self.blog_content_edit.toPlainText()
        self.markdown_preview.set_markdown_content(md_text)

    def _get_data_from_widgets(self, data_dict, widgets_dict):
        updated_data = data_dict.copy()
        for key, widget in widgets_dict.items():
            original_value = data_dict.get(key)
            if isinstance(widget, QTextEdit):
                text_value = widget.toPlainText()
                if isinstance(original_value, (list, dict)):
                    try:
                        updated_data[key] = json.loads(text_value)
                    except json.JSONDecodeError:
                        updated_data[key] = text_value 
                        print(f"Warning: Could not parse JSON for field '{{key}}'. Saved as string.")
                else:
                    updated_data[key] = text_value
            elif isinstance(widget, QLineEdit):
                text_value = widget.text()
                if isinstance(original_value, int):
                    try: updated_data[key] = int(text_value)
                    except ValueError: updated_data[key] = text_value
                elif isinstance(original_value, float):
                    try: updated_data[key] = float(text_value)
                    except ValueError: updated_data[key] = text_value
                elif isinstance(original_value, bool):
                    updated_data[key] = text_value.lower() in ['true', '1', 'yes']
                elif original_value is None and (text_value.lower() == 'null' or not text_value):
                     updated_data[key] = None
                else:
                    updated_data[key] = text_value
        return updated_data

    def save_current_prediction(self):
        current_row = self.predictions_list_widget.currentRow()
        if current_row < 0:
            QMessageBox.warning(self, "No Prediction Selected", "Please select a prediction to save.")
            return

        original_prediction = self.predictions_data[current_row]
        updated_prediction = self._get_data_from_widgets(original_prediction, self.prediction_fields_widgets)
        
        if 'id' not in self.prediction_fields_widgets and 'id' in original_prediction:
             updated_prediction['id'] = original_prediction['id']

        self.predictions_data[current_row] = updated_prediction
        self._save_data_to_file(PREDICTIONS_FILE, self.predictions_data, "Predictions")
        pred = self.predictions_data[current_row]
        self.predictions_list_widget.item(current_row).setText(f"{{pred.get('id', 'N/A')}}: {{pred.get('text', 'No Text')[:50]}}...")


    def prepare_new_blog_post(self):
        self.current_blog_is_new = True
        self.blog_list_widget.setCurrentRow(-1) # Deselect any item in the list

        # Generate a new placeholder ID (simple increment for now)
        new_id_num = 1
        if self.blog_posts_data:
            ids = [int(p['id'][1:]) for p in self.blog_posts_data if p['id'].startswith('B') and p['id'][1:].isdigit()]
            if ids:
                new_id_num = max(ids) + 1
        new_id = f"B{{str(new_id_num).zfill(3)}}"

        from datetime import date
        today = date.today().strftime("%Y-%m-%d")

        new_post_template = {{
            "id": new_id,
            "title": "New Blog Post Title",
            "date": today,
            "author": "Your Name",
            "summary": "A brief summary of this new post.",
            "content": "# New Post\n\nStart writing your Markdown content here!",
            "tags": ["new", "draft"]
        }}

        # Clear previous metadata editor widgets
        for i in reversed(range(self.blog_metadata_editor_area_layout.count())):
            widget_item = self.blog_metadata_editor_area_layout.itemAt(i).widget()
            if isinstance(widget_item, QScrollArea):
                widget_item.deleteLater()
                break
        self.blog_fields_widgets.clear()

        self.blog_fields_widgets = self.create_form_layout_from_dict(
            new_post_template, 
            self.blog_metadata_editor_area_layout, 
            excluded_keys=['content'] # Content is handled by dedicated editor
        )
        self.blog_content_edit.setText(new_post_template.get('content', ''))
        self.update_markdown_preview()
        QMessageBox.information(self, "New Blog Post", f"Editing new blog post. ID will be '{{new_id}}'. Fill details and save.")

    def save_current_blog_post(self):
        if self.current_blog_is_new:
            # Data is already in widgets from prepare_new_blog_post
            # We just need to construct the full new post object from them
            new_post_data = {{}}
            for key, widget in self.blog_fields_widgets.items():
                original_template_value = None # Not strictly needed here but for consistency with _get_data
                if isinstance(widget, QTextEdit):
                    text_value = widget.toPlainText()
                    if key == 'tags': # Assuming tags is a list of strings
                        try: new_post_data[key] = json.loads(text_value)
                        except: new_post_data[key] = [t.strip() for t in text_value.split(',') if t.strip()]
                    else: new_post_data[key] = text_value
                elif isinstance(widget, QLineEdit):
                     new_post_data[key] = widget.text()
            
            new_post_data['content'] = self.blog_content_edit.toPlainText()
            
            # Ensure ID is correctly taken if it was editable (it should be from the template)
            if 'id' not in new_post_data and self.blog_fields_widgets.get('id'):
                 new_post_data['id'] = self.blog_fields_widgets['id'].text()
            elif 'id' not in new_post_data: # Fallback if ID field somehow missing
                QMessageBox.critical(self, "Error", "Could not determine ID for new blog post.")
                return

            # Check for duplicate ID
            if any(p['id'] == new_post_data['id'] for p in self.blog_posts_data):
                QMessageBox.warning(self, "Duplicate ID", f"A blog post with ID '{{new_post_data['id']}}' already exists. Please change the ID.")
                return

            self.blog_posts_data.append(new_post_data)
            self._save_data_to_file(BLOG_POSTS_FILE, self.blog_posts_data, "Blog Posts")
            self.blog_list_widget.addItem(f"{{new_post_data.get('id')}}: {{new_post_data.get('title', 'No Title')}}")
            self.blog_list_widget.setCurrentRow(self.blog_list_widget.count() - 1)
            self.current_blog_is_new = False # Reset flag
            QMessageBox.information(self, "Blog Post Saved", "New blog post saved successfully.")

        else: # Existing post saving logic
            current_row = self.blog_list_widget.currentRow()
            if current_row < 0:
                QMessageBox.warning(self, "No Blog Post Selected", "Please select a blog post to save.")
                return

            original_post = self.blog_posts_data[current_row]
            updated_post_metadata = self._get_data_from_widgets(original_post, self.blog_fields_widgets)
            updated_post_metadata['content'] = self.blog_content_edit.toPlainText()
            if 'id' not in self.blog_fields_widgets and 'id' in original_post:
                 updated_post_metadata['id'] = original_post['id']

            self.blog_posts_data[current_row] = updated_post_metadata
            self._save_data_to_file(BLOG_POSTS_FILE, self.blog_posts_data, "Blog Posts")
            post = self.blog_posts_data[current_row]
            self.blog_list_widget.item(current_row).setText(f"{{post.get('id', 'N/A')}}: {{post.get('title', 'No Title')}}")

    def _save_data_to_file(self, filepath, data, data_name):
        try:
            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
            QMessageBox.information(self, f"{{data_name}} Saved", f"{{data_name}} data saved successfully to\n{{filepath}}")
        except Exception as e:
            QMessageBox.critical(self, f"Error Saving {{data_name}}", f"Could not save data to {{filepath}}:\n{{e}}")


if __name__ == '__main__':
    if hasattr(Qt, 'AA_EnableHighDpiScaling'):
        QApplication.setAttribute(Qt.ApplicationAttribute.AA_EnableHighDpiScaling, True)
    if hasattr(Qt, 'AA_UseHighDpiPixmaps'):
        QApplication.setAttribute(Qt.ApplicationAttribute.AA_UseHighDpiPixmaps, True)
        
    app = QApplication(sys.argv)

    window = EditorWindow()
    window.showMaximized()
    sys.exit(app.exec()) 